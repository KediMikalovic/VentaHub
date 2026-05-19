# VentaHub - Teknoloji Yığını Referans Belgesi (tech_stack.md)
Sürüm: 1.0 (MVP Odaklı)  
Rol: Chief Technology Officer (CTO)
---
## 1. Stack Karşılaştırması
Mimari gereksinimleri karşılamak için masada üç güçlü alternatif bulunuyor:
### Seçenek 1: "The TypeScript Enterprise" (React + NestJS + PostgreSQL + Redis/BullMQ)
* Artıları: Frontend ve Backend aynı dilde (TypeScript) yazılır, kaynak ve model paylaşımı hızı artırır. NestJS, mimaride hedeflenen "Modüler Monolit" yapıyı native olarak destekler. PostgreSQL, çoklu kiracı (Multi-tenant) veri izolasyonu için "Row-Level Security" konusunda mükemmeldir. Redis + BullMQ ikilisi asenkron işçiler (Async Workers) için biçilmiş kaftandır.
* Eksileri: Node.js, CPU-bound (çok ağır matematiksel) işlemlerde Java/Go kadar performanslı değildir (ancak bizim I/O ağırlıklı senkronizasyon işimiz için fazlasıyla yeterlidir).
### Seçenek 2: "The Heavyweight" (React + Java Spring Boot + PostgreSQL + RabbitMQ)
* Artıları: Gerçek bir kurumsal canavardır. Çoklu thread yönetimi ve ağır arka plan işleri için piyasadaki en sağlam yapıdır. RabbitMQ mesaj kuyruğu konusunda endüstri standardıdır.
* Eksileri: MVP için geliştirme hızı çok yavaştır. Kaynak tüketimi yüksektir. Startup dinamiklerine ve "Zaman/Maliyet dengesine" uygun değildir.
### Seçenek 3: "The BaaS/Serverless" (React + Supabase + Edge Functions / Inngest)
* Artıları: Geliştirme hızı (Time-to-Market) inanılmaz yüksektir. Kimlik doğrulama, veritabanı (Postgres) ve Row-Level Security hazır gelir.
* Eksileri: Pazaryerlerinin katı "Rate Limit" kurallarına takılmadan binlerce stoğu güncellemek Serverless mimarilerde çok zordur ve maliyetleri tahmin edilemez hale getirir. Arka plan işçileri (Workers) üzerinde tam kontrol sağlamak MVP aşamasında risk yaratır.
---
## 2. Optimum Seçim: "The TypeScript Enterprise" (Seçenek 1)
VentaHub MVP'si için TypeScript / NestJS / React / PostgreSQL ekosistemini seçiyoruz. 
Gerekçeler:
1. Geliştirme Hızı ve Kaynak: Frontend ve Backend ekiplerinin aynı dili (TypeScript) konuşması, API arayüzlerinde tip güvenliği (Type Safety) sağlar. Hızlıca canlıya çıkma (MVP) hedefine en uygun dildir.
2. Mimari Uyum: Sistem tasarımındaki Modüler Monolit yaklaşım, NestJS'in doğasında vardır. İleride mikroservislere bölünmek istenirse en az acı veren framework'tür.
3. Kuyruk Yönetimi: Yarış durumlarını (Race Condition) önlemek ve stokları otonom senkronize etmek için Redis üzerinde koşan BullMQ, Node.js ekosistemindeki en olgun çözümdür.
---
## 3. Ekosistem Detayları ve Spesifik Araçlar
Modüllerin inşasında kullanılacak spesifik kütüphaneler şunlardır:
### 3.1. Frontend / Client
* Core: React.js (Vite ile derlenmiş SPA). Sadece backend'den gelen veriyi sunar.
* State Management: Zustand. (Redux'ın gereksiz karmaşasından kaçınmak ve performansı yüksek tutmak için).
* Veri Çekme (Data Fetching): TanStack Query (React Query). Caching mekanizması sayesinde dashboard'un 2 saniyenin altında yüklenmesine yardımcı olur.
* Styling: Tailwind CSS + shadcn/ui. "Premium" hissiyatı veren minimalist ve modern UI/UX tasarımı için en hızlı ve özelleştirilebilir bileşen kütüphanesidir.
* Veri Görselleştirme: Recharts veya Chart.js. Basit kâr hesaplama ve özet Dashboard için.
### 3.2. Backend & Core Engine
* Framework: NestJS (Node.js & Express/Fastify).
* ORM (Object-Relational Mapping): Prisma veya Drizzle ORM. Her KOBİ için ayrı veri izolasyonunu (Tenant ID tabanlı Row Level Security) ORM seviyesinde kolayca uygulamak için.
### 3.3. Veritabanı ve Caching
* Primary Database: PostgreSQL. Çoklu kiracı mimarisi (Multi-tenant) ve ACID prensipleri için standart.
* Caching Store: Redis. Dashboard verilerinin milisaniyeler içinde sunulması ve Rate Limit sayaçlarının tutulması için.
### 3.4. Async Worker & Queue Engine
* Mesaj Kuyruğu: BullMQ (Redis tabanlı).
* Kullanım: Sipariş kabul (Order_Ingestion_Queue) ve stok güncelleme (Stock_Update_Queue) işlemlerini yönetir. Pazaryeri API çöküşlerine karşı hataları (Retry mekanizmaları) BullMQ'nun yerleşik "Exponential Backoff" özelliğiyle yöneteceğiz.
### 3.5. Security & Auth
* Kimlik Doğrulama: JWT (JSON Web Tokens) tabanlı custom Auth veya Supabase Auth (Sadece kimlik yönetimi için entegre edilebilir).
* Veri Şifreleme: Node.js yerleşik crypto modülü kullanılarak, AES-256 standartlarında Envelope Encryption. API anahtarları veritabanında şifreli (Ciphertext) tutulacaktır.

