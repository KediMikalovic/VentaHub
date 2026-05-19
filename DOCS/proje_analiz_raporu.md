# VentaHub — Detaylı Proje Analiz Raporu
Tarih: 18 Mayıs 2026  
Analist: Claude (Cowork Mode)

---

## 1. Projenin Genel Amacı

VentaHub, KOBİ'lerin (küçük ve orta ölçekli işletmeler) birden fazla e-ticaret pazaryerindeki operasyonlarını tek bir merkezden yönetmesini sağlayan bir **SaaS platformudur**. Temel hedef; stok senkronizasyonu, kâr hesaplama ve iade takibini otomatikleştirerek satıcıların manuel iş yükünü sıfıra yaklaştırmak.

İlk hedef pazaryeri **Trendyol**, ikincisi **Hepsiburada** olmak üzere genişlemeye açık bir mimari kurulmuştur.

---

## 2. Mimari Genel Bakış

### Katmanlar

```
┌─────────────────────────────────────────┐
│       Frontend (Next.js 14)             │
│   SPA · Tailwind CSS · ShadCN UI        │
└─────────────────┬───────────────────────┘
                  │ HTTP / REST
┌─────────────────▼───────────────────────┐
│       Backend (NestJS 11)               │
│   JWT Auth · Prisma ORM · BullMQ        │
└──────┬──────────────────────────┬───────┘
       │                          │
┌──────▼──────┐         ┌─────────▼───────┐
│ PostgreSQL  │         │     Redis        │
│  (Primary)  │         │  (Queue Store)   │
└─────────────┘         └─────────────────┘
```

**Mimari Stil:** Modüler Monolit — ileride mikroservislere bölünebilecek şekilde tasarlanmış. Akıllı bir seçim: MVP için gereksiz dağıtık sistem karmaşıklığından kaçınılmış.

---

## 3. Teknoloji Yığını

### Backend
| Teknoloji | Versiyon | Kullanım Amacı |
|---|---|---|
| NestJS | 11 | API framework (decorator tabanlı, modüler) |
| Prisma ORM | 7.8 | Veritabanı erişimi ve migration yönetimi |
| PostgreSQL | 15 | Ana ilişkisel veritabanı |
| BullMQ | 5.76 | Redis tabanlı asenkron iş kuyruğu |
| @nestjs/schedule | 6.1 | Cron job yönetimi |
| bcrypt | 6.0 | Parola hashleme |
| passport-jwt | 4.0 | JWT kimlik doğrulama |
| p-limit | 7.3 | API rate-limit koruması |
| TypeScript | 6.0 | Tip güvenliği |

### Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|---|---|---|
| Next.js | 14 | SSR/SSG framework |
| React | 18.2 | UI kütüphanesi |
| Tailwind CSS | 3.4 | Utility-first CSS |
| ShadCN / Radix UI | — | Erişilebilir UI bileşenleri |
| @tanstack/react-table | 8.21 | Gelişmiş tablo yönetimi |
| SWR | 2.4 | Veri fetching ve cache |
| Zustand | 5.0 | Global state yönetimi |
| React Hook Form | 7.74 | Form yönetimi |
| Zod | 4.3 | Şema doğrulama |
| Recharts | 2.15 | Grafik ve veri görselleştirme |
| Axios | 1.15 | HTTP istemcisi |

### Altyapı
- **Docker Compose**: PostgreSQL 15-alpine + Redis 7-alpine ile tek komutta çalışan geliştirme ortamı
- **Healthcheck**: Her iki servis için otomatik sağlık kontrolü tanımlanmış

---

## 4. Veritabanı Modeli Analizi

Şema 5 ana bölüme ayrılmış ve iyi tasarlanmış:

### 4.1. Multi-Tenant Kimlik Yönetimi
- `Tenant` → `User` ilişkisi ile her KOBİ kendi izole ortamında çalışır
- Plan tipleri: `TRIAL`, `BASIC`, `PRO` — abonelik modeline hazır
- Kullanıcı rolleri: `OWNER`, `ADMIN`, `VIEWER` — rol bazlı yetkilendirme

### 4.2. Entegrasyon Yönetimi
- `TenantIntegration` modeli ile her KOBİ birden fazla pazaryerine bağlanabilir
- API anahtarları `encryptedApiKey` / `encryptedApiSecret` alanlarında **şifreli** saklanır
- Webhook kimlik doğrulaması için ayrı `webhookApiKey` alanı

### 4.3. Ürün Kataloğu
- `(tenantId, barcode)` üzerinde unique index → tenant izolasyonu + çakışma koruması
- `attributes: Json?` alanı → platform bazlı dinamik özellikler için esnek yapı
- `costPrice` ve `salePrice` ayrımı → net kâr hesaplamaya altyapı hazır

### 4.4. Sipariş ve İade Zinciri
- `Order` → `OrderItem` → `ReturnItem` ilişki zinciri temiz kurulmuş
- `OrderType` enum: `STANDARD`, `MICRO_EXPORT`, `FOREIGN_BROKERAGE` — cross-border ticaret hazırlığı
- `LabelStatus` ile kargo etiketi yaşam döngüsü takibi
- `claimLineItemId: @unique` ile mükerrer iade kaydı önleniyor

### 4.5. Finansal Defter
- `FinancialLedger` modeli çift kayıt muhasebe mantığına yakın tasarlanmış
- `sellerRevenue`, `commissionAmount`, `cargoExpense`, `returnCargoExpense`, `netProfit` alanları
- `transactionId: @unique` — harici sistem ID ile idempotency garantisi

---

## 5. Backend Modül Analizi

### Temel İş Modülleri
| Modül | Sorumluluk |
|---|---|
| `AuthModule` | Kayıt, giriş, JWT üretimi; tenant oluşturma transaksiyonu |
| `ProductsModule` | Ürün listeleme, güncelleme, fiyat değişikliği |
| `OrdersModule` | Sipariş sorgulama |
| `DashboardModule` | 7 günlük KPI özeti ve grafik verisi |
| `FinanceModule` | Finansal kayıt sorgulama |
| `ReturnsModule` | İade yönetimi |
| `SettingsModule` | Tenant profili ve entegrasyon yönetimi |

### Trendyol Entegrasyon Modülleri
| Modül | Sorumluluk |
|---|---|
| `TrendyolModule` | Core Trendyol API servisi (rate limiting, interceptors) |
| `TrendyolWebhookModule` | Webhook alımı ve kuyruğa yönlendirme |
| `TrendyolCatalogModule` | Ürün kataloğu senkronizasyonu |
| `TrendyolInventoryModule` | Stok/fiyat güncelleme kuyruğu |
| `TrendyolShippingReturnsModule` | Kargo ve iade operasyonları, SLA cron'u |
| `TrendyolFinanceModule` | Sipariş kâr hesaplama motoru |

---

## 6. Öne Çıkan Güçlü Yönler

### 6.1. Güvenlik Mimarisi — İyi Kurulmuş
- **AES-256-GCM** ile API anahtarı şifreleme (`iv:authTag:ciphertext` formatı)
- `bcrypt` (salt rounds: 10) ile parola hashleme
- JWT payload'unda `tenantId` taşınarak her istekte tenant doğrulaması
- Tüm servis metodlarında `tenantId` filtresi zorunlu kılınmış (veri izolasyonu)
- Interceptor'da `Authorization` header'ı hata loglarında maskeleniyor

### 6.2. Asenkron İş Kuyruğu — Sağlam Tasarım
- Webhook geldiğinde sipariş `ORDER_INGESTION` kuyruğuna atılıyor, ana thread bloklanmıyor
- Stok güncellemesi `INVENTORY_UPDATE` kuyruğuna alınıyor; 3 deneme, 5'er saniye backoff
- `p-limit(5)` ile Trendyol API'sine saniyede maksimum 5 istek kısıtı
- `BullMQ`'nun retry mekanizması ile geçici API hatalarına karşı dayanıklılık

### 6.3. Idempotency Koruması
- `OrderIngestionProcessor`'da sipariş işlenmeden önce `findUnique` ile mükerrerlik kontrolü
- `FinancialLedger.transactionId: @unique` ile harici referans güvencesi
- `ReturnItem.claimLineItemId: @unique` ile iade idempotency

### 6.4. Kâr Hesaplama Motoru
- Sipariş kaydedildikten sonra `financeService.calculateOrderProfit` **fire-and-forget** olarak çalışıyor
- KDV, komisyon (%15 sabit), kargo maliyeti ve maliyet fiyatı çıkartılarak net kâr hesaplanıyor
- Kargo maliyeti çok kalemli siparişlerde sadece ilk kaleme yansıtılıyor (gerçekçi yaklaşım)

### 6.5. SLA Takibi
- `returns-sla.cron.ts` saatte bir çalışarak 36 saati aşmış iade taleplerini tespit ediyor
- Dashboard'da `slaRiskCount` KPI'ı kırmızı alarm rengiyle öne çıkıyor

### 6.6. Frontend Kalitesi
- SWR ile akıllı cache ve otomatik yeniden fetch
- İskelet (Skeleton) loader bileşenleri — kullanıcı deneyimi düşünülmüş
- ShadCN/Radix UI — erişilebilir, test edilebilir bileşenler
- Zustand ile 3 adımlı onboarding wizard state yönetimi
- Middleware ile korunan route'lar (JWT cookie doğrulaması)

---

## 7. Tespit Edilen Eksiklikler ve Riskler

### 7.1. Yüksek Öncelikli Riskler

**[RİSK-1] Sabit Komisyon Oranı**
`trendyol-finance.service.ts` içinde komisyon oranı `0.15` olarak hard-coded.
Trendyol'da komisyon oranı kategoriye göre %4–%27 arasında değişir.
→ Öneri: `Product.attributes` alanına `commissionRate` eklenmeli veya ayrı bir `CommissionTable` modeli kurulmalı.

**[RİSK-2] Sabit Kargo Ücreti**
Kargo maliyeti `39.90 TL` olarak hard-coded.
Desi bazlı ve anlaşmaya göre değişen kargo tarifesi dinamik olmalı.
→ Öneri: `TenantIntegration`'a ya da ayrı bir konfigürasyon tablosuna taşınmalı.

**[RİSK-3] Mock KMS — Gerçek KMS Yok**
`trendyol.service.ts` içinde interceptor'daki "Mock KMS Çözme" yorumu gerçek bir KMS entegrasyonu olmadığını gösteriyor. Header'daki şifreli anahtar mock değerlerle çözülüyor.
→ Öneri: Üretimde `decrypt()` utility fonksiyonu DB'den çekilen şifreli anahtara uygulanmalı ve gerçek header akışı kurulmalı.

**[RİSK-4] `USE_MOCK_API` Environment Bayrağı**
`TrendyolApiService`'te `useMock` bayrağı prod ortamına sızabilir.
→ Öneri: Build-time environment check veya ayrı bir guard mekanizması eklenmeli.

**[RİSK-5] Test Yokluğu**
Projede hiçbir test dosyası bulunmuyor (unit, integration, e2e). Özellikle kâr hesaplama motoru, idempotency mantığı ve stok delta işlemleri kritik iş mantığı içeriyor.
→ Öneri: En azından `TrendyolFinanceService`, `OrderIngestionProcessor` ve `crypto.util` için birim testleri yazılmalı.

### 7.2. Orta Öncelikli Eksiklikler

**[EKS-1] Dashboard'da Caching Yok**
PRD ve sistem tasarımında Redis caching mimariden söz edilmiş ancak `DashboardService` her çağrıda doğrudan veritabanına gidiyor. Yüksek trafikte dar boğaz olur.

**[EKS-2] Hepsiburada Entegrasyonu Yok**
Schema'da `Platform` enum'unda `HEPSIBURADA` var, ancak backend'de ilgili modül henüz yok.

**[EKS-3] Frontend'de Sipariş ve İade Sayfaları Eksik Bağlantı**
`orders/page.tsx` ve `returns/page.tsx` mevcut ancak bazı bileşenler (örn: `order-detail-sheet.tsx`) için backend API entegrasyonu tamamlanmamış görünüyor.

**[EKS-4] Güvenlik: `webhookApiKey` Hard-coded Default**
`settings.service.ts` içinde `webhookApiKey: integration.webhookApiKey || 'v-hub_test_secret_key_2026'` satırı production'da güvenlik açığı.

**[EKS-5] `TestController` Production'da Kalmamalı**
`app.module.ts`'de `TestController` import edilmiş. Production build'den çıkarılmalı.

**[EKS-6] Emniyet Stoğu (Safety Stock) Hesabı Yok**
PRD'de FR8 olarak tanımlanmış "Sales Velocity" bazlı emniyet stoğu hesabı henüz implement edilmemiş. MVP scope dokümanında "Could-Have" olarak işaretlenmiş, bu mantıklı bir karar.

### 7.3. Düşük Öncelikli İyileştirmeler

- `DashboardService`'teki metrik hesaplama döngüsü, sipariş sayısı büyüdükçe verimini yitirir; SQL aggregate sorgusuna taşınabilir.
- Frontend `middleware.ts`'in kapsamı genişletilebilir (refresh token mekanizması eksik).
- `Product.stockQuantity` güncellemesi `OrderIngestionProcessor`'da transaction içinde değil, sıralı await ile yapılıyor; race condition riski var.

---

## 8. MVP Durum Değerlendirmesi

| Öncelik | Özellik | Durum |
|---|---|---|
| P1 | Güvenli Altyapı + Auth + Multi-Tenant | ✅ Tamamlandı |
| P1 | AES-256 API Key Şifreleme | ✅ Tamamlandı |
| P2 | Stok Senkronizasyonu (Webhook + Queue) | ✅ Tamamlandı |
| P2 | Stok Delta → Trendyol'a push | ✅ Tamamlandı |
| P3 | Temel Kâr Hesaplama (Fire & Forget) | ✅ Tamamlandı (sabit oranlarla) |
| P4 | Dashboard KPI + Grafik | ✅ Tamamlandı |
| — | SLA Cron (İade Takibi) | ✅ Bonus: Tamamlandı |
| — | Test Coverage | ❌ Yok |
| — | Production Caching (Redis) | ❌ Yok |
| — | Gerçek KMS Entegrasyonu | ⚠️ Mock durumunda |

---

## 9. Sonuç

VentaHub, MVP için gerekli teknik temelleri sağlam biçimde atmış bir proje. Multi-tenant güvenlik mimarisi, BullMQ ile asenkron sipariş işleme, AES-256 şifreleme ve idempotency korumaları gerçek bir üretim sisteminden beklenen kalitede.

Projenin üretim hazırlığı için önce **test coverage** ve **dinamik komisyon/kargo oranları** çözülmeli, ardından **Redis caching** eklenerek ölçeklenebilirlik güvence altına alınmalıdır. Mock KMS'in gerçek bir akışa taşınması da canlıya geçmeden önce kritik öneme sahip.

Genel değerlendirme: **MVP hedeflerine büyük ölçüde ulaşılmış, teknik borç yönetilebilir düzeyde.**
