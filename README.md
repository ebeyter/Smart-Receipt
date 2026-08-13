# Cepdefter

*Fişlerin ve bütçen tek yerde — Exposure AI Academy, Proje 7: Smart Receipt.*

Fiş fotoğraflarını yükle, yapay zekâ (fal.ai / Claude Sonnet) bilgileri okusun,
düzenleyip onayladıktan sonra Google Sheets'e ve Google Drive'a otomatik olarak
kaydolsun.

## Yerel geliştirme

```bash
npm install
cp .env.example .env.local   # aşağıdaki değişkenleri doldur
npm run dev
```

### Ortam değişkenleri (`.env.local`)

| Değişken | Açıklama |
|---|---|
| `FAL_KEY` | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) adresinden alınır. Sadece sunucu tarafında kullanılır. |
| `GOOGLE_APPS_SCRIPT_URL` | Aşağıdaki Apps Script kurulumundan sonra elde edilen Web App URL'si. |
| `NEXT_PUBLIC_GOOGLE_SHEET_URL` | İsteğe bağlı. Doldurulursa Ayarlar sayfasında "Sheet'i aç" kısayolu görünür. |

## Sayfalar

| Yol | İçerik |
|---|---|
| `/` | Landing — karşılama, aylık özet şeridi ve **Başla** butonu. |
| `/panel` | Uygulama: yükleme, analiz, düzenlenebilir tablo, aylık özet. |
| `/plan` | Finansal planlama: gelir/bütçe girişi, kalan, son 6 ay, kategori dağılımı. |
| `/ayarlar` | Tema (açık/koyu/sistem), vurgu rengi, varsayılanlar, bağlantı testi, CSV dışa aktarma. |

Proje brief'i gereği kimlik doğrulama yok; uygulama tek kullanıcılı kişisel bir
araç olarak çalışır.

## Tema

Renkler `src/app/globals.css` içinde `light-dark()` ile tanımlı; hangi şemanın
kazandığını `<html>` üzerindeki `data-theme` özniteliği belirler. Tercih
`localStorage`'da (`sr-settings`) tutulur ve `layout.tsx` içindeki küçük bir
inline script sayesinde ilk boyamadan önce uygulanır — tema değişiminde flash
olmaz. Vurgu rengi (`data-accent`) ve "hareketleri azalt" (`data-motion`) aynı
mekanizmayı kullanır.

## Google Sheet + Apps Script kurulumu

1. Yeni bir Google Sheet oluştur (Apps Script sayfayı otomatik hazırlayacak,
   ama istersen `apps-script/Code.gs` içindeki `HEADERS` ile aynı başlıkları
   ilk satıra elle de yazabilirsin: Merchant, Date, Time, Category, Total,
   Currency, Tax / VAT, Bank Name, Items, Receipt Image URL, Uploaded At).
2. Google Drive'da **"Smart Receipt Uploads"** adında bir klasör oluştur, aç ve
   adres çubuğundaki `https://drive.google.com/drive/folders/<ID>` kısmındaki
   ID'yi not al (klasör oluşturmayı script'e bırakıp bu adımı atlayabilirsin).
3. Sheet içinde **Extensions → Apps Script**'i aç.
4. `apps-script/Code.gs` dosyasının içeriğini oraya yapıştır. Dosyanın
   başındaki `DRIVE_FOLDER_ID = ""` satırına 2. adımdaki klasör ID'sini
   yapıştır (boş bırakırsan script klasörü isme göre bulur/oluşturur), kaydet.
5. Editörde fonksiyon listesinden **testReceipt**'i seç, ▶ **Run**'a bas.
   İlk çalıştırmada Google, Drive/Sheets izinleri için onay isteyecek —
   kendi hesabınla onayla. **View → Logs**'tan `success: true` cevabını,
   Sheet'te test satırını ve Drive klasöründe test görselini doğrula.
6. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Deploy sonrası verilen Web App URL'sini kopyala, `.env.local` içindeki
   `GOOGLE_APPS_SCRIPT_URL` değerine yapıştır.
8. Uygulamadan gerçek bir fiş göndererek uçtan uca test et.

### Örnek (demo) veri

Sunum ya da ekran görüntüsü için Apps Script'te **`seedDemoReceipts`** fonksiyonunu
çalıştır: geçmiş beş aya yayılmış 22 örnek fiş ekler, böylece Planlama
sayfasındaki "Son 6 ay" grafiği ve kategori dağılımı dolu görünür.
Geri almak için **`removeDemoReceipts`** — yalnızca eklediği satırları siler,
gerçek fişlerine dokunmaz.

### Sheet üzerindeki özet ve pasta grafik

Apps Script editöründe fonksiyon listesinden **`buildDashboard`**'u seçip ▶ Run'a
bas. "Dashboard" adlı bir sayfa oluşturur: bu ayın toplam harcaması, kategori
tablosu ve tabloya bağlı bir pasta grafik. Her yeni fiş gönderiminde `doPost`
bu fonksiyonu çağırdığı için toplam ve grafik kendiliğinden güncellenir.

Aynı sayfadaki **E3** (aylık gelir) ve **E4** (aylık bütçe) hücrelerine değer
yazarsan, `MonthlyIncome` / `MonthlyBudget` named range'leri üzerinden hem
haftalık e-posta özetinde hem uygulamanın Planlama sayfasında kullanılır.

### Bonus — tek fotoğrafta birden fazla fiş

Model her fotoğraf için fiş **dizisi** döndürüyor (`src/lib/fal.ts`). Fotoğrafta
yan yana duran iki-üç fiş varsa panel bunları ayrı satırlara bölüyor, önizleme
etiketinde `2/3` gibi bir sayaç gösteriyor ve "bir fotoğrafta N fiş bulundu"
bilgisi çıkıyor. Aynı fotoğraftan bölünen satırlar ortak bir `groupId` taşıdığı
için görsel Drive'a yalnızca bir kez yükleniyor, URL tüm satırlara yazılıyor.

### Bonus — haftalık e-posta özeti

Apps Script projesinde **Triggers → Add Trigger**:
- Function: `weeklyEmailSummary`
- Event source: Time-driven
- Type: Week timer

## Vercel'e deploy

1. Repoyu GitHub'a push et (zaten bağlı: `origin` → bu repo).
2. [vercel.com/new](https://vercel.com/new) üzerinden repoyu import et.
3. Project Settings → Environment Variables kısmına ekle:
   - `FAL_KEY`
   - `GOOGLE_APPS_SCRIPT_URL`
   - `NEXT_PUBLIC_GOOGLE_SHEET_URL` (isteğe bağlı)
4. Deploy et, canlı URL'i masaüstü ve mobilde test et.

## Proje yapısı

```
src/
  app/
    layout.tsx           # Tema scripti + SettingsProvider
    page.tsx             # Landing
    (app)/layout.tsx     # Üst çubuk (Panel / Ayarlar / tema düğmesi)
    (app)/panel/         # Yükleme, tablo, özet
    (app)/ayarlar/       # Tercihler
    api/analyze/         # fal.ai ile fiş okuma
    api/submit/          # Onaylanan fişleri Apps Script'e gönderir
    api/history/         # Geçmiş kayıtları Apps Script'ten okur
  components/            # UploadPanel, ResultsTable, SummaryPanel, AppHeader, ...
  lib/                   # types, fal.ts, categories, format, settings
apps-script/
  Code.gs                # Google Apps Script (Drive + Sheet + haftalık özet)
```
