/**
 * Smart Receipt — Google Apps Script
 *
 * Kurulum:
 * 1. Kendi Google Sheet dosyanı oluştur, ilk satıra şu başlıkları yaz:
 *    Merchant | Date | Time | Category | Total | Currency | Tax / VAT | Bank Name | Items | Receipt Image URL | Uploaded At
 * 2. Extensions > Apps Script'i aç, bu dosyanın içeriğini yapıştır.
 * 3. Google Drive'da "Smart Receipt Uploads" adında bir klasör oluştur, klasörü aç ve
 *    URL'deki ID'yi aşağıdaki DRIVE_FOLDER_ID'ye yapıştır (boş bırakırsan script klasörü
 *    isme göre bulur/otomatik oluşturur).
 * 4. Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Verilen Web app URL'sini .env.local içindeki GOOGLE_APPS_SCRIPT_URL'ye yapıştır.
 * 6. Kurulumu doğrulamak için editörde testReceipt() fonksiyonunu çalıştır ve
 *    Execution log'da (View > Logs) sonucu kontrol et.
 *
 * Bonus — Haftalık e-posta özeti:
 * 7. Fonksiyon menüsünden installWeeklyTrigger() seç ve Run'a bas (her Pazartesi
 *    09:00 civarı weeklyEmailSummary'yi otomatik çalıştıracak bir tetikleyici kurar).
 * 8. Haftayı beklemeden test etmek için testWeeklyEmailSummary() fonksiyonunu çalıştır.
 *
 * Örnek veri (sunum için):
 *  - seedDemoReceipts() geçmiş beş aya yayılmış 22 örnek fiş ekler.
 *  - removeDemoReceipts() aynı satırları geri siler.
 *
 * Özet sayfası (aylık toplam + pasta grafik):
 * 9. Fonksiyon menüsünden buildDashboard() seç ve Run'a bas. "Dashboard" sayfasını
 *    oluşturur: bu ayın toplamı, kategori tablosu ve ona bağlı pasta grafik.
 *    Her yeni fiş gönderiminde otomatik tazelenir.
 * 10. Aynı sayfadaki E3 (aylık gelir) ve E4 (aylık bütçe) hücrelerine değer yazarsan
 *     hem haftalık e-postada hem uygulamanın Planlama sayfasında kullanılır;
 *     buildDashboard() bu hücrelerin named range'lerini (MonthlyIncome /
 *     MonthlyBudget) kendisi tanımlar.
 */

// Drive'da "Smart Receipt Uploads" klasörünü aç, adres çubuğundaki
// https://drive.google.com/drive/folders/<BURASI> ID'sini buraya yapıştır.
const DRIVE_FOLDER_ID = "1fh5Y7u0aT35KzHt69MR3UtK-6_FXa7Jx";

const SHEET_NAME = "Receipts";
const DRIVE_FOLDER_NAME = "Smart Receipt Uploads";
const HEADERS = [
  "Merchant",
  "Date",
  "Time",
  "Category",
  "Total",
  "Currency",
  "Tax / VAT",
  "Bank Name",
  "Items",
  "Receipt Image URL",
  "Uploaded At",
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getFolder_() {
  if (DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  }
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function saveImage_(dataUrl, fileName) {
  if (!dataUrl) return "";
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) return "";
  const contentType = match[1];
  const base64 = match[2];
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, contentType, fileName || "receipt.jpg");
  const file = getFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://drive.google.com/uc?id=" + file.getId();
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const receipts = payload.receipts || [];
    const sheet = getSheet_();
    const now = new Date().toISOString();
    const saved = [];

    // Bir fotografta birden fazla fis bulunduysa satirlar ayni groupId ile gelir;
    // gorsel Drive'a bir kez yuklenip ayni URL tum satirlara yazilir.
    const imageUrlByGroup = {};

    receipts.forEach(function (r) {
      let imageUrl;
      if (r.groupId && imageUrlByGroup[r.groupId]) {
        imageUrl = imageUrlByGroup[r.groupId];
      } else {
        imageUrl = saveImage_(r.imageDataUrl, r.fileName);
        if (r.groupId) imageUrlByGroup[r.groupId] = imageUrl;
      }
      const row = [
        r.merchant || "",
        r.date || "",
        r.time || "",
        r.category || "",
        r.total || 0,
        r.currency || "",
        r.tax || "",
        r.bankName || "",
        (r.items || []).join(", "),
        imageUrl,
        now,
      ];
      sheet.appendRow(row);
      saved.push({
        merchant: r.merchant || "",
        date: r.date || "",
        time: r.time || "",
        category: r.category || "",
        total: r.total || 0,
        currency: r.currency || "",
        tax: r.tax || "",
        bankName: r.bankName || "",
        items: r.items || [],
        receiptImageUrl: imageUrl,
        uploadedAt: now,
      });
    });

    // Yeni satirlar eklendi; Sheet uzerindeki ozet ve pasta grafik tazelensin.
    buildDashboard();

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, saved: saved.length, receipts: saved })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1); // skip header

    const receipts = rows
      .filter(function (row) {
        return row[0] || row[4]; // has merchant or total
      })
      .map(function (row) {
        return {
          merchant: row[0],
          date: row[1] instanceof Date ? formatDate_(row[1]) : row[1],
          time: row[2] instanceof Date ? formatTime_(row[2]) : row[2],
          category: row[3],
          total: Number(row[4]) || 0,
          currency: row[5],
          tax: row[6],
          bankName: row[7],
          items: row[8] ? String(row[8]).split(", ") : [],
          receiptImageUrl: row[9],
          uploadedAt: row[10],
        };
      });

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        receipts: receipts,
        monthlyBudget: getMonthlyBudget_(),
        monthlyIncome: getMonthlyIncome_(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err), receipts: [] })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatTime_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");
}

/**
 * Bonus: Haftalık harcama özeti e-postası.
 *
 * - Para birimlerini birbirine eklemez; her para birimi kendi toplamıyla gösterilir.
 * - HTML e-posta: kategori dağılımı renkli çubuklarla, uygulamadaki donut chart /
 *   Dashboard pasta grafiğiyle aynı renk paletiyle (bkz. CATEGORY_COLORS).
 * - "MonthlyBudget" adında bir Named Range tanımlarsan (TRY, bkz. dosya başındaki
 *   kurulum notları) bu ayki bütçe kullanım durumunu da gösterir.
 * - Gerçek tetikleyici: installWeeklyTrigger(). Anında test: testWeeklyEmailSummary().
 */

const CATEGORY_COLORS = {
  Market: "#2a78d6",
  Yemek: "#eb6834",
  Ulaşım: "#1baf7a",
  Alışveriş: "#eda100",
  Sağlık: "#e87ba4",
  Eğitim: "#008300",
  Eğlence: "#4a3aa7",
  Fatura: "#e34948",
  Diğer: "#9a9a9a",
};

const DASHBOARD_NAME = "Dashboard";

/**
 * Sheet uzerindeki ozet sayfasini olusturur/tazeler:
 *   - bu ayin toplam harcamasi
 *   - kategori bazli tablo ve ona bagli pasta grafik
 *   - MonthlyIncome / MonthlyBudget hucreleri (named range'leri de kurar)
 * Her yeni fis gonderiminde doPost tarafindan cagrilir; elle de calistirilabilir.
 */
function buildDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DASHBOARD_NAME);
  if (!sheet) sheet = ss.insertSheet(DASHBOARD_NAME);

  const rows = getSheet_().getDataRange().getValues().slice(1);
  const monthKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");

  const totals = {};
  let monthTotal = 0;
  rows.forEach(function (row) {
    const dateStr = row[1] instanceof Date ? formatDate_(row[1]) : String(row[1] || "");
    if (dateStr.indexOf(monthKey) !== 0) return;
    const category = row[3] || "Diğer";
    const amount = Number(row[4]) || 0;
    totals[category] = (totals[category] || 0) + amount;
    monthTotal += amount;
  });

  const breakdown = Object.keys(totals)
    .map(function (category) {
      return [category, totals[category]];
    })
    .sort(function (a, b) {
      return b[1] - a[1];
    });

  // Yalnizca ozet blogu temizlenir; sagdaki gelir/butce hucreleri korunur.
  sheet.getRange("A1:B20").clearContent();

  const monthLabel = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");
  sheet.getRange("A1").setValue("Smart Receipt — Özet").setFontSize(14).setFontWeight("bold");
  sheet.getRange("A3").setValue(monthLabel + " toplam").setFontWeight("bold");
  sheet.getRange("B3").setValue(monthTotal).setNumberFormat("₺#,##0.00").setFontWeight("bold");

  sheet.getRange("A5:B5").setValues([["Kategori", "Toplam"]]).setFontWeight("bold");
  if (breakdown.length > 0) {
    sheet.getRange(6, 1, breakdown.length, 2).setValues(breakdown);
    sheet.getRange(6, 2, breakdown.length, 1).setNumberFormat("₺#,##0.00");
  }

  sheet.getRange("D3").setValue("Aylık gelir (₺)");
  sheet.getRange("D4").setValue("Aylık bütçe (₺)");
  sheet.getRange("E3:E4").setNumberFormat("₺#,##0.00");
  if (!ss.getRangeByName("MonthlyIncome")) ss.setNamedRange("MonthlyIncome", sheet.getRange("E3"));
  if (!ss.getRangeByName("MonthlyBudget")) ss.setNamedRange("MonthlyBudget", sheet.getRange("E4"));

  // Grafik her seferinde bastan kurulur, boylece kategori sayisi degisince uyar.
  sheet.getCharts().forEach(function (chart) {
    sheet.removeChart(chart);
  });

  if (breakdown.length > 0) {
    const colors = breakdown.map(function (entry) {
      return CATEGORY_COLORS[entry[0]] || "#9a9a9a";
    });
    const chart = sheet
      .newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange(5, 1, breakdown.length + 1, 2))
      .setPosition(6, 4, 0, 0)
      .setOption("title", monthLabel + " — kategori dağılımı")
      .setOption("pieSliceText", "percentage")
      .setOption("colors", colors)
      .setOption("width", 460)
      .setOption("height", 300)
      .build();
    sheet.insertChart(chart);
  }

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 120);
  return { monthTotal: monthTotal, categories: breakdown.length };
}

function weeklyEmailSummary() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  sendWeeklySummary_(since);
}

/** Haftayı beklemeden, tüm geçmiş kayıtları dahil ederek anında test e-postası gönderir. */
function testWeeklyEmailSummary() {
  sendWeeklySummary_(new Date(2000, 0, 1));
}

function sendWeeklySummary_(since) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);

  const periodRows = rows.filter(function (row) {
    if (!(row[0] || row[4])) return false;
    const uploadedAt = row[10] ? new Date(row[10]) : null;
    return uploadedAt && uploadedAt >= since;
  });

  if (periodRows.length === 0) {
    Logger.log("Bu dönemde fiş bulunamadı, e-posta gönderilmedi.");
    return;
  }

  const totalsByCurrency = {};
  const categoryByCurrency = {};
  let maxExpense = 0;
  let maxMerchant = "";
  let maxCurrency = "";

  periodRows.forEach(function (row) {
    const amount = Number(row[4]) || 0;
    const currency = row[5] || "—";
    const category = row[3] || "Diğer";

    totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
    if (!categoryByCurrency[currency]) categoryByCurrency[currency] = {};
    categoryByCurrency[currency][category] =
      (categoryByCurrency[currency][category] || 0) + amount;

    if (amount > maxExpense) {
      maxExpense = amount;
      maxMerchant = row[0] || "Bilinmeyen";
      maxCurrency = currency;
    }
  });

  const budget = getMonthlyBudget_();
  const monthSpendTRY = budget ? getMonthTotalForCurrency_(rows, "TRY") : 0;

  const html = buildWeeklySummaryHtml_({
    rowCount: periodRows.length,
    totalsByCurrency: totalsByCurrency,
    categoryByCurrency: categoryByCurrency,
    maxExpense: maxExpense,
    maxMerchant: maxMerchant,
    maxCurrency: maxCurrency,
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    budget: budget,
    monthSpendTRY: monthSpendTRY,
  });

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "Smart Receipt — Haftalık Özet",
    body: "Bu e-postayı görüntülemek için HTML destekleyen bir e-posta istemcisi kullanın.",
    htmlBody: html,
  });
}

/** Dashboard sayfasındaki "MonthlyBudget" named range'ini okur (TRY). Yoksa null. */
function getMonthlyBudget_() {
  const range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName("MonthlyBudget");
  if (!range) return null;
  const value = Number(range.getValue());
  return value > 0 ? value : null;
}

/** Dashboard sayfasındaki "MonthlyIncome" named range'ini okur (TRY). Yoksa null. */
function getMonthlyIncome_() {
  const range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName("MonthlyIncome");
  if (!range) return null;
  const value = Number(range.getValue());
  return value > 0 ? value : null;
}

function getMonthTotalForCurrency_(rows, currency) {
  const monthKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");
  let total = 0;
  rows.forEach(function (row) {
    const dateStr = row[1] instanceof Date ? formatDate_(row[1]) : String(row[1] || "");
    if (dateStr.indexOf(monthKey) === 0 && (row[5] || "") === currency) {
      total += Number(row[4]) || 0;
    }
  });
  return total;
}

function buildWeeklySummaryHtml_(data) {
  const currencyBlocks = Object.keys(data.totalsByCurrency)
    .map(function (currency) {
      const total = data.totalsByCurrency[currency];
      const categories = data.categoryByCurrency[currency];
      const catRows = Object.keys(categories)
        .sort(function (a, b) {
          return categories[b] - categories[a];
        })
        .map(function (cat) {
          const amount = categories[cat];
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
          const color = CATEGORY_COLORS[cat] || "#9a9a9a";
          return (
            '<tr>' +
            '<td style="padding:6px 10px 6px 0;font-size:13px;color:#1f2937;white-space:nowrap;">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' +
            color +
            ';margin-right:6px;"></span>' +
            cat +
            "</td>" +
            '<td style="padding:6px 0;width:100%;">' +
            '<div style="background:#f0efec;border-radius:4px;height:8px;overflow:hidden;">' +
            '<div style="background:' + color + ';width:' + pct + '%;height:8px;"></div>' +
            "</div></td>" +
            '<td style="padding:6px 0 6px 10px;font-size:12px;color:#52514e;white-space:nowrap;text-align:right;">' +
            amount.toFixed(2) +
            " " +
            currency +
            " (" +
            pct +
            "%)</td>" +
            "</tr>"
          );
        })
        .join("");

      return (
        '<div style="margin-bottom:22px;">' +
        '<div style="font-size:24px;font-weight:700;color:#0b0b0b;">' +
        total.toFixed(2) +
        " " +
        currency +
        "</div>" +
        '<table style="width:100%;border-collapse:collapse;margin-top:8px;">' +
        catRows +
        "</table></div>"
      );
    })
    .join("");

  let budgetHtml = "";
  if (data.budget) {
    const pct = Math.round((data.monthSpendTRY / data.budget) * 100);
    const over = data.monthSpendTRY > data.budget;
    const barColor = over ? "#d03b3b" : "#0ca30c";
    budgetHtml =
      '<div style="margin-bottom:22px;padding:14px 16px;background:#f9f9f7;border-radius:10px;">' +
      '<div style="font-size:12px;color:#52514e;margin-bottom:6px;">Bu Ayki Bütçe Durumu (TRY)</div>' +
      '<div style="font-size:15px;font-weight:600;color:#0b0b0b;">' +
      data.monthSpendTRY.toFixed(2) +
      " / " +
      data.budget.toFixed(2) +
      " (" + pct + "%)</div>" +
      '<div style="background:#e1e0d9;border-radius:4px;height:8px;overflow:hidden;margin-top:8px;">' +
      '<div style="background:' + barColor + ';width:' + Math.min(pct, 100) + '%;height:8px;"></div>' +
      "</div>" +
      (over
        ? '<div style="font-size:12px;color:#d03b3b;margin-top:6px;">⚠️ Bu ay bütçeni aştın.</div>'
        : "") +
      "</div>";
  }

  return (
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937;">' +
    '<div style="font-size:13px;color:#52514e;margin-bottom:4px;">🧾 Smart Receipt</div>' +
    '<h2 style="font-size:18px;color:#0b0b0b;margin:0 0 18px 0;">Haftalık Harcama Özeti</h2>' +
    currencyBlocks +
    budgetHtml +
    '<div style="font-size:13px;color:#52514e;margin-bottom:18px;">' +
    "<strong>" + data.rowCount + "</strong> fiş eklendi. En yüksek harcama: <strong>" +
    data.maxMerchant + "</strong> (" + data.maxExpense.toFixed(2) + " " + data.maxCurrency + ")" +
    "</div>" +
    '<a href="' + data.sheetUrl + '" style="display:inline-block;background:#0f6e63;color:#ffffff;' +
    'text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">' +
    "Google Sheet'i Aç</a>" +
    "</div>"
  );
}

/** Haftalık e-posta tetikleyicisini kurar (her Pazartesi ~09:00). Tekrar çalıştırmak eskisini değiştirir. */
function installWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "weeklyEmailSummary") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger("weeklyEmailSummary")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  Logger.log("Haftalık tetikleyici kuruldu: her Pazartesi 09:00 civarı.");
}

/**
 * Test: doPost'u sahte bir POST isteğiyle çalıştırır, tek piksellik bir
 * test görseli Drive'a kaydeder ve Receipts sayfasına bir satır ekler.
 * Editörde bu fonksiyonu seçip ▶ Run'a bas, sonucu View > Logs'tan izle.
 */
/* ---------------------------------------------------------------------------
   Örnek (demo) veri
   Sunum/ekran görüntüsü için geçmiş aylara yayılmış fişler ekler. Gerçek
   fişlerine dokunmaz; eklediklerini geri almak için removeDemoReceipts().
--------------------------------------------------------------------------- */

// Demo satirlari bu isimlerle yazilir; temizleme bunlara bakarak calisir.
const DEMO_ROWS = [
  { monthsAgo: 5, day: 4, merchant: "Migros", category: "Market", total: 742.4, tax: 67.49, bank: "Garanti BBVA", items: "Süt, Ekmek, Yumurta, Deterjan" },
  { monthsAgo: 5, day: 11, merchant: "Shell", category: "Ulaşım", total: 1850.0, tax: 308.33, bank: "Yapı Kredi", items: "V-Power Yakıt" },
  { monthsAgo: 5, day: 19, merchant: "Kahve Dünyası", category: "Yemek", total: 264.5, tax: 24.05, bank: "Garanti BBVA", items: "Latte, Sandviç" },
  { monthsAgo: 5, day: 26, merchant: "Türk Telekom", category: "Fatura", total: 649.9, tax: 108.32, bank: "İş Bankası", items: "İnternet faturası" },

  { monthsAgo: 4, day: 3, merchant: "CarrefourSA", category: "Market", total: 968.75, tax: 88.07, bank: "Garanti BBVA", items: "Haftalık alışveriş" },
  { monthsAgo: 4, day: 9, merchant: "İBB İSPARK", category: "Ulaşım", total: 180.0, tax: 30.0, bank: "Yapı Kredi", items: "Otopark" },
  { monthsAgo: 4, day: 15, merchant: "Watsons", category: "Sağlık", total: 432.6, tax: 39.33, bank: "İş Bankası", items: "Vitamin, Şampuan" },
  { monthsAgo: 4, day: 22, merchant: "Cinemaximum", category: "Eğlence", total: 320.0, tax: 29.09, bank: "Garanti BBVA", items: "2 sinema bileti" },
  { monthsAgo: 4, day: 28, merchant: "Enerjisa", category: "Fatura", total: 1124.3, tax: 187.38, bank: "İş Bankası", items: "Elektrik faturası" },

  { monthsAgo: 3, day: 2, merchant: "Migros", category: "Market", total: 1145.2, tax: 104.11, bank: "Garanti BBVA", items: "Aylık market" },
  { monthsAgo: 3, day: 8, merchant: "Starbucks", category: "Yemek", total: 198.0, tax: 18.0, bank: "Yapı Kredi", items: "Filtre kahve, Cheesecake" },
  { monthsAgo: 3, day: 14, merchant: "Decathlon", category: "Alışveriş", total: 2340.0, tax: 390.0, bank: "Garanti BBVA", items: "Koşu ayakkabısı" },
  { monthsAgo: 3, day: 21, merchant: "Shell", category: "Ulaşım", total: 1720.5, tax: 286.75, bank: "Yapı Kredi", items: "Yakıt" },

  { monthsAgo: 2, day: 5, merchant: "Şok Market", category: "Market", total: 486.9, tax: 44.26, bank: "İş Bankası", items: "Temel gıda" },
  { monthsAgo: 2, day: 12, merchant: "Udemy", category: "Eğitim", total: 899.0, tax: 149.83, bank: "Garanti BBVA", items: "Online kurs" },
  { monthsAgo: 2, day: 17, merchant: "Big Chefs", category: "Yemek", total: 1240.0, tax: 112.73, bank: "Garanti BBVA", items: "Akşam yemeği" },
  { monthsAgo: 2, day: 24, merchant: "İGDAŞ", category: "Fatura", total: 780.4, tax: 130.07, bank: "İş Bankası", items: "Doğalgaz faturası" },

  { monthsAgo: 1, day: 6, merchant: "Migros", category: "Market", total: 1032.6, tax: 93.87, bank: "Garanti BBVA", items: "Market alışverişi" },
  { monthsAgo: 1, day: 13, merchant: "Eczane Rüya", category: "Sağlık", total: 356.75, tax: 32.43, bank: "Yapı Kredi", items: "Reçeteli ilaç" },
  { monthsAgo: 1, day: 18, merchant: "Zara", category: "Alışveriş", total: 1899.0, tax: 316.5, bank: "Garanti BBVA", items: "Mont" },
  { monthsAgo: 1, day: 23, merchant: "Marti TAG", category: "Ulaşım", total: 145.0, tax: 24.17, bank: "Yapı Kredi", items: "Scooter" },
  { monthsAgo: 1, day: 29, merchant: "Spotify", category: "Eğlence", total: 89.99, tax: 15.0, bank: "İş Bankası", items: "Aylık abonelik" },
];

/** Geçmiş beş aya yayılmış örnek fişleri Sheet'e ekler ve özeti tazeler. */
function seedDemoReceipts() {
  const sheet = getSheet_();
  const now = new Date();
  const tz = Session.getScriptTimeZone();
  let added = 0;

  DEMO_ROWS.forEach(function (demo) {
    const date = new Date(now.getFullYear(), now.getMonth() - demo.monthsAgo, demo.day, 13, 30);
    sheet.appendRow([
      demo.merchant,
      Utilities.formatDate(date, tz, "yyyy-MM-dd"),
      Utilities.formatDate(date, tz, "HH:mm"),
      demo.category,
      demo.total,
      "TRY",
      demo.tax,
      demo.bank,
      demo.items,
      "",
      date.toISOString(),
    ]);
    added++;
  });

  buildDashboard();
  Logger.log("Eklenen örnek fiş: " + added);
  return added;
}

/** seedDemoReceipts ile eklenen satırları siler; gerçek fişlere dokunmaz. */
function removeDemoReceipts() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();
  const now = new Date();

  // Demo satirlari: ayni magaza + ayni tarih + ayni tutar ucluleri.
  const signatures = {};
  DEMO_ROWS.forEach(function (demo) {
    const date = new Date(now.getFullYear(), now.getMonth() - demo.monthsAgo, demo.day, 13, 30);
    signatures[demo.merchant + "|" + Utilities.formatDate(date, tz, "yyyy-MM-dd") + "|" + demo.total] = true;
  });

  let removed = 0;
  for (let row = values.length; row >= 2; row--) {
    const value = values[row - 1];
    const dateStr = value[1] instanceof Date ? formatDate_(value[1]) : String(value[1] || "");
    const key = value[0] + "|" + dateStr + "|" + Number(value[4]);
    if (signatures[key]) {
      sheet.deleteRow(row);
      removed++;
    }
  }

  buildDashboard();
  Logger.log("Silinen örnek fiş: " + removed);
  return removed;
}

function testReceipt() {
  // 1x1 şeffaf PNG — gerçek fiş görseli olmadan Drive kaydını test etmek için.
  const testImageDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  const payload = {
    receipts: [
      {
        merchant: "Test Market",
        date: "2026-08-11",
        time: "14:30",
        category: "Market",
        total: 125.5,
        currency: "TRY",
        tax: 11.3,
        bankName: "Test Bank",
        items: ["Ekmek", "Süt", "Yumurta"],
        imageDataUrl: testImageDataUrl,
        fileName: "test-receipt.png",
      },
    ],
  };

  const fakeEvent = {
    postData: {
      contents: JSON.stringify(payload),
    },
  };

  const response = doPost(fakeEvent);
  Logger.log(response.getContent());
}
