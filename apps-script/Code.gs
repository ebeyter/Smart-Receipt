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
      JSON.stringify({ success: true, receipts: receipts })
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
 * Kurulum: Triggers > Add Trigger > weeklyEmailSummary > Time-driven > Week timer.
 */
function weeklyEmailSummary() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekRows = rows.filter(function (row) {
    const uploadedAt = row[10] ? new Date(row[10]) : null;
    return uploadedAt && uploadedAt >= oneWeekAgo;
  });

  if (weekRows.length === 0) return;

  let total = 0;
  let maxExpense = 0;
  let maxMerchant = "";
  const byCategory = {};

  weekRows.forEach(function (row) {
    const amount = Number(row[4]) || 0;
    total += amount;
    if (amount > maxExpense) {
      maxExpense = amount;
      maxMerchant = row[0];
    }
    const cat = row[3] || "Diğer";
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  });

  const categoryLines = Object.keys(byCategory)
    .map(function (cat) {
      return "- " + cat + ": " + byCategory[cat].toFixed(2);
    })
    .join("\n");

  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const body =
    "Haftalık harcama özetin:\n\n" +
    "Toplam: " + total.toFixed(2) + "\n" +
    "Fiş sayısı: " + weekRows.length + "\n" +
    "En yüksek harcama: " + maxMerchant + " (" + maxExpense.toFixed(2) + ")\n\n" +
    "Kategori bazlı:\n" + categoryLines + "\n\n" +
    "Sheet: " + sheetUrl;

  MailApp.sendEmail(Session.getActiveUser().getEmail(), "Smart Receipt — Haftalık Özet", body);
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
