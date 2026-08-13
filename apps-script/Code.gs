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

    receipts.forEach(function (r) {
      const imageUrl = saveImage_(r.imageDataUrl, r.fileName);
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
