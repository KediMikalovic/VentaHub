<div align="center">

# VentaHub

**KOBİ'ler için akıllı e-ticaret yönetim platformu**

Trendyol başta olmak üzere çoklu pazaryerlerini tek panelden yönetin —
sipariş, stok, iade, finans ve AI destekli içgörüler tek çatı altında.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Başlarken](#başlarken)
  - [Ön Koşullar](#ön-koşullar)
  - [Kurulum](#kurulum)
  - [Ortam Değişkenleri](#ortam-değişkenleri)
  - [Veritabanı Kurulumu](#veritabanı-kurulumu)
  - [Çalıştırma](#çalıştırma)
- [API Referansı](#api-referansı)
- [Proje Yapısı](#proje-yapısı)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

---

## Özellikler

### Katalog & Stok Yönetimi
- Ürün ekleme, düzenleme ve silme (manuel ve Trendyol kaynaklı)
- Kritik stok uyarıları (eşik altı ürünler kırmızıyla işaretlenir)
- Alış / satış fiyatı karşılaştırması ve anlık kâr marjı hesabı
- Tek tıkla Trendyol'a stok/fiyat senkronizasyonu

### Sipariş Yönetimi
- Manuel sipariş oluşturma (otomatik stok düşümü, komisyon & kargo hesabı)
- Durum akışı: `Created → Picking → Shipped → Delivered / Cancelled`
- Sipariş detay paneli: kargo takip no, barkod, net kâr görünümü
- Trendyol webhook entegrasyonu ile gerçek zamanlı sipariş akışı

### İade Yönetimi
- SLA takibi: 36 saat eşiğini aşan bekleyen iadeler kırmızı uyarıyla öne çıkar
- Onayla / Reddet / Tamamla aksiyon butonları
- Sipariş numarasıyla manuel iade talebi oluşturma
- Müşteri notu kaydetme, durum geçmişi

### Finansal Zeka
- Komisyon, kargo ve iade maliyetleri çıkarılmış **Net Kâr** hesabı
- Ödeme takvimi & mutabakat durumu (PAID / PENDING)
- Haftalık gelir / gider grafiği

### AI Destekli İçgörüler (Gemini Pro)
- Doğal dil sorgulama: _"Bu hafta en çok iade edilen ürün hangisi?"_
- Otomatik haftalık rapor üretimi
- İade örüntüsü analizi ve ürün bazlı risk skoru
- Google Cloud Natural Language API destekli niyet tanıma

### SaaS Altyapısı
- Multi-tenant mimari: her işletme izole veri havuzunda çalışır
- JWT tabanlı kimlik doğrulama, bcrypt şifre hash
- Pazaryeri API anahtarları AES-256 şifreleme ile saklanır
- BullMQ + Redis iş kuyruğu (webhook, katalog senkronizasyonu, asenkron görevler)
- Zamanlanmış görevler: SLA kontrol cron, stok uyarı taraması

---

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                │
│  Dashboard │ Katalog │ Siparişler │ İadeler │ Finans │ AI   │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTP (Next.js rewrites proxy)
┌───────────────────────▼─────────────────────────────────────┐
│                     Backend (NestJS 10)                     │
│                                                             │
│  Auth  │  Products  │  Orders  │  Returns  │  Finance       │
│  Dashboard  │  AI-Insights  │  Trendyol Integration         │
│                                                             │
│  ┌──────────────┐   ┌──────────┐   ┌───────────────────┐   │
│  │  PostgreSQL  │   │  Redis   │   │  Google AI        │   │
│  │  (Prisma)    │   │ (BullMQ) │   │  Gemini + NL API  │   │
│  └──────────────┘   └──────────┘   └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │  Trendyol REST API
              ┌─────────▼──────────┐
              │   Trendyol         │
              │  Catalog / Orders  │
              │  Shipping / Finance│
              └────────────────────┘
```

### Dual-Source Veri Modeli

Ürünler ve siparişler `DataSource` alanı ile etiketlenir:

| Kaynak       | Açıklama                                     |
|-------------|----------------------------------------------|
| `MANUAL`    | Panel üzerinden manuel girilen kayıtlar       |
| `TRENDYOL`  | Trendyol API/webhook üzerinden senkronize edilenler |

Her iki kaynak aynı veritabanında birlikte yaşar; Trendyol entegrasyonu manuel girişleri ezmez.

---

## Teknoloji Yığını

### Backend (`/backend`)

| Katman            | Teknoloji                                      |
|-------------------|------------------------------------------------|
| Framework         | NestJS 10, TypeScript                          |
| ORM               | Prisma 6 + `@prisma/adapter-pg`                |
| Veritabanı        | PostgreSQL 15                                  |
| Cache / Kuyruk    | Redis 7, BullMQ, `@nestjs/bullmq`              |
| Kimlik Doğrulama  | JWT (`@nestjs/jwt`), Passport, bcrypt          |
| Şifreleme         | AES-256 (Node.js crypto)                       |
| AI                | Google Gemini Pro (`@google/generative-ai`)     |
| NLP               | Google Cloud Natural Language (`@google-cloud/language`) |
| Zamanlayıcı       | `@nestjs/schedule`                             |
| HTTP Client       | `@nestjs/axios`                                |
| Validasyon        | `class-validator`, `class-transformer`         |

### Frontend (`/frontend`)

| Katman            | Teknoloji                                      |
|-------------------|------------------------------------------------|
| Framework         | Next.js 15 (App Router), TypeScript            |
| UI Kütüphanesi    | Tailwind CSS, shadcn/ui (Radix UI primitives)  |
| Tablo             | TanStack Table v8                              |
| Form & Validasyon | React Hook Form, Zod                           |
| Veri Çekme        | SWR, Axios                                     |
| Grafikler         | Recharts                                       |
| State             | Zustand                                        |
| İkonlar           | Lucide React                                   |

---

## Başlarken

### Ön Koşullar

- **Node.js** v20 veya üzeri
- **Docker** & **Docker Compose** (PostgreSQL + Redis için)
- **npm** v10 veya üzeri
- **Google AI Studio** API anahtarı → [aistudio.google.com](https://aistudio.google.com/apikey)

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/KULLANICI_ADI/ventahub.git
cd ventahub

# 2. Backend bağımlılıklarını kur
cd backend
npm install

# 3. Frontend bağımlılıklarını kur
cd ../frontend
npm install
```

### Ortam Değişkenleri

`backend/.env.example` dosyasını `backend/.env` olarak kopyalayın ve değerleri doldurun:

```bash
cp backend/.env.example backend/.env
```

```env
# Veritabanı
DATABASE_URL="postgresql://ventahub_user:ventahub_pass@localhost:5432/ventahub_db?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Backend portu
PORT=3001

# Şifreleme anahtarı (AES-256 için 64 karakter hex)
# Üretmek için: openssl rand -hex 32
ENCRYPTION_KEY=your_64_char_hex_key_here

# Google AI Studio — ücretsiz API anahtarı
# https://aistudio.google.com/apikey adresinden edinin
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Natural Language (opsiyonel)
# Service account JSON dosyasını backend/ klasörüne koyun
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

> **Önemli:** `.env` ve `google-credentials.json` dosyaları `.gitignore` ile koruma altındadır, asla commit etmeyin.

### Veritabanı Kurulumu

```bash
# PostgreSQL ve Redis'i Docker ile başlat
cd backend
docker compose up -d

# Prisma migration'larını çalıştır
npx prisma migrate deploy

# Prisma client'ı yenile
npx prisma generate

# Örnek verileri yükle (12 ürün, 50 sipariş, 12 iade, 5 SLA kritik iade)
npx prisma db seed
```

Seed sonrası test hesabı:

| Alan     | Değer                   |
|----------|-------------------------|
| E-posta  | `admin@ventahub.com`    |
| Şifre    | `Ventahub2026!`         |

### Çalıştırma

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend
npm run start:dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışmaya başlar.

---

## API Referansı

Tüm korumalı endpoint'ler `Authorization: Bearer <JWT>` başlığı gerektirir.

### Auth

| Metod | Endpoint             | Açıklama            |
|-------|----------------------|---------------------|
| POST  | `/auth/register`     | Yeni firma kaydı    |
| POST  | `/auth/login`        | JWT token al        |

### Katalog

| Metod  | Endpoint                  | Açıklama                          |
|--------|---------------------------|-----------------------------------|
| GET    | `/products`               | Ürün listesi                      |
| POST   | `/products`               | Yeni ürün ekle (manuel)           |
| PATCH  | `/products/:id`           | Ürün düzenle                      |
| PATCH  | `/products/:id/price`     | Fiyat güncelle                    |
| DELETE | `/products/:id`           | Ürün sil (sipariş varsa engeller) |

### Siparişler

| Metod  | Endpoint                  | Açıklama                              |
|--------|---------------------------|---------------------------------------|
| GET    | `/orders`                 | Sipariş listesi                       |
| POST   | `/orders`                 | Manuel sipariş oluştur (stok düşer)   |
| PATCH  | `/orders/:id/status`      | Durum güncelle                        |

### İadeler

| Metod  | Endpoint                        | Açıklama                             |
|--------|---------------------------------|--------------------------------------|
| GET    | `/returns`                      | İade listesi + SLA risk sayısı       |
| GET    | `/returns/stats`                | İstatistikler (toplam, durum dağılımı) |
| GET    | `/returns/order/:orderNumber`   | Sipariş kalemlerini getir (iade formu için) |
| POST   | `/returns`                      | Manuel iade talebi oluştur           |
| PATCH  | `/returns/:id/status`           | Durum güncelle (Onayla/Reddet/Tamamla) |

### Finans

| Metod | Endpoint                | Açıklama                     |
|-------|-------------------------|------------------------------|
| GET   | `/finance/summary`      | Gelir/gider özeti            |
| GET   | `/finance/ledger`       | Mutabakat kayıtları          |

### Dashboard

| Metod | Endpoint                | Açıklama                        |
|-------|-------------------------|---------------------------------|
| GET   | `/dashboard/summary`    | KPI kartları + haftalık grafik  |

### AI Insights

| Metod | Endpoint                          | Açıklama                           |
|-------|-----------------------------------|------------------------------------|
| POST  | `/ai-insights/ask`                | Doğal dil sorgulama                |
| GET   | `/ai-insights/weekly-report`      | Haftalık AI raporu                 |
| GET   | `/ai-insights/return-analysis`    | İade analizi + risk skorları       |

### Trendyol Entegrasyonu

| Metod | Endpoint                                       | Açıklama                        |
|-------|------------------------------------------------|---------------------------------|
| POST  | `/integrations/trendyol/inventory/update`      | Stok/fiyat senkronizasyonu      |
| POST  | `/integrations/trendyol/webhook`               | Trendyol webhook alıcısı        |

---

## Proje Yapısı

```
ventahub/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Veri modeli (Tenant, Product, Order, Return, FinancialLedger)
│   │   └── seed.ts                # Örnek veri yükleyici
│   ├── src/
│   │   ├── common/                # Guard, decorator, strategy, util
│   │   ├── database/              # PrismaService, PrismaModule
│   │   ├── integrations/
│   │   │   ├── google-ai/         # GeminiService, NlApiService, AgentService
│   │   │   └── trendyol/          # Catalog, Inventory, Shipping, Finance, Webhook
│   │   └── modules/
│   │       ├── auth/              # Kayıt, giriş, JWT
│   │       ├── products/          # CRUD + Trendyol sync
│   │       ├── orders/            # CRUD + stok yönetimi
│   │       ├── returns/           # SLA takibi + CRUD
│   │       ├── finance/           # Mutabakat, net kâr
│   │       ├── dashboard/         # KPI aggregation
│   │       └── ai-insights/       # Gemini entegrasyonu
│   └── docker-compose.yml         # PostgreSQL + Redis
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── catalog/       # Katalog sayfası
│   │   │   │   ├── orders/        # Siparişler sayfası
│   │   │   │   ├── returns/       # İadeler sayfası
│   │   │   │   └── finance/       # Finans sayfası
│   │   │   ├── login/             # Giriş
│   │   │   └── register/          # Kayıt (3 adımlı onboarding)
│   │   ├── components/
│   │   │   ├── ai/                # InsightsPanel, AskAI, ReturnAnalysisChart
│   │   │   ├── products/          # DataTable, EditSheet, AddSheet, DeleteDialog
│   │   │   ├── orders/            # DataTable, AddSheet, DetailSheet
│   │   │   ├── returns/           # ReturnAddSheet
│   │   │   └── ui/                # shadcn/ui bileşenleri
│   │   └── hooks/                 # useSWR tabanlı veri hook'ları
│   └── next.config.mjs            # Backend proxy rewrites
│
└── DOCS/                          # PRD, sistem tasarımı, teknik dokümanlar
```

---

## Veri Modeli (Özet)

```
Tenant (firma)
  └── User[]           (rol: OWNER / ADMIN / VIEWER)
  └── TenantIntegration[]  (Trendyol API bilgileri — AES-256 şifreli)
  └── Product[]        (barcode unique per tenant, source: MANUAL | TRENDYOL)
  └── Order[]
        └── OrderItem[]
              └── ReturnItem[]   (SLA: createdAt > 36h + WaitingForApproval = risk)
        └── FinancialLedger      (sellerRevenue, commission, cargo, netProfit)
```

---

## Geliştirme Notları

### Yeni Prisma Migration

```bash
cd backend
npx prisma migrate dev --name migration_adi
npx prisma generate
```

### Seed Verisini Sıfırla

```bash
cd backend
npx prisma db seed
```

Seed her çalıştırıldığında mevcut sipariş/iade kayıtları silinerek 45 günlük yayılımlı örnek veri yeniden oluşturulur. Kullanıcı ve ürünler korunur.

### SLA Eşiği

İade bekleyen kayıtlar (`WaitingForApproval`) 36 saati aşarsa SLA riskli olarak işaretlenir. Eşiği değiştirmek için:

```typescript
// backend/src/modules/returns/returns.service.ts
const SLA_HOURS = 36;
```

---

## Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/ozellik-adi`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: açıklama'`)
4. Branch'i push edin (`git push origin feature/ozellik-adi`)
5. Pull Request açın

---

## Lisans

MIT License. Detaylar için `LICENSE` dosyasına bakın.

---

<div align="center">
  VentaHub — KOBİ e-ticaretini akıllı hale getir.
</div>
