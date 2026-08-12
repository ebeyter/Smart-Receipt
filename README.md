# Smart Receipt

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
| `APP_PASSWORD` | Uygulamaya giriş şifresi (bkz. [Giriş / şifre koruması](#giriş--şifre-koruması)). Boş bırakılırsa giriş ekranı devre dışı kalır. |

## Giriş / şifre koruması

Uygulamanın kendi kullanıcı hesap sistemi yok — tek bir paylaşılan şifreyle
korunuyor (`proxy.ts`). `APP_PASSWORD` tanımlıysa `/login` dışındaki tüm
sayfalar şifre istiyor; doğru şifre girilince imzalı bir `sr_session`
çerezi (30 gün) düşüyor. Sağ üstteki **"Çıkış yap"** ile çerez siliniyor.
`APP_PASSWORD` boşsa (veya tanımlı değilse) giriş ekranı tamamen devre dışı
kalır — herkes uygulamayı açabilir.

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
   - `APP_PASSWORD` (giriş şifresi — boş bırakırsan uygulama şifresiz kalır)
4. Deploy et, canlı URL'i masaüstü ve mobilde test et.

## Proje yapısı

```
src/
  proxy.ts               # Şifre kontrolü (route öncesi çalışır)
  app/
    page.tsx            # Ana sayfa (yükleme, tablo, özet)
    login/               # Giriş ekranı
    api/analyze/         # fal.ai ile fiş okuma
    api/submit/          # Onaylanan fişleri Apps Script'e gönderir
    api/history/         # Geçmiş kayıtları Apps Script'ten okur
    api/login/           # Şifre doğrulama, sr_session çerezi oluşturur
    api/logout/          # sr_session çerezini siler
  components/            # UploadPanel, ResultsTable, SummaryPanel, ...
  lib/                   # types, fal.ts, categories, format, auth
apps-script/
  Code.gs                # Google Apps Script (Drive + Sheet + haftalık özet)
```
