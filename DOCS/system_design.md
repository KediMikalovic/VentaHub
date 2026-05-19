# VentaHub - System Architecture Blueprint (system_design.md)
Sistem Sürümü: V0.1 (MVP Odaklı)
Mimari Stil: Modular Monolith (Modüler Monolit) - Gelecekte Mikroservislere (Microservices) kolayca bölünebilir yapı.
## 1. Sistem Bileşenleri (System Components)
VentaHub MVP'si, teknoloji yığınından bağımsız olarak aşağıdaki 5 temel modülden oluşur:
### 1.1. Client / Frontend (Kullanıcı Arayüzü)
* Rol: KOBİ'lerin sistemi yöneteceği Web Uygulaması (SPA - Single Page Application).
* Davranış: İş mantığı (Business Logic) barındırmaz. Sadece Backend API'den gelen veriyi sunar ve kullanıcı komutlarını (örneğin "Fiyat Güncelle") Backend'e iletir. NFR1 (Hız) gereği statik dosyalar CDN (Content Delivery Network) üzerinden dağıtılır.
### 1.2. API Gateway & Load Balancer (Giriş Kapısı)
* Rol: Frontend'den gelen tüm HTTP isteklerinin ilk karşılandığı nokta.
* Davranış: İstekleri doğrular (Authentication - NFR2), yetkilendirir ve doğru iç modüle yönlendirir. Kötü niyetli istekleri (DDoS) engeller.
### 1.3. Core Engine (Ana İş Mantığı Modülü)
* Alt Modüller:
    * Auth & Tenant Manager: KOBİ kayıtları, kullanıcı oturumları ve Tenant ID izolasyonunu yönetir.
    * Finance & Profit Calculator (FR4): Sipariş brüt tutarı, komisyon ve kargo baremlerini birleştirip Net Kârı hesaplayan işlem motoru.
    * Dashboard Aggregator (FR1): Caching katmanından günlük, haftalık özet verileri toplayıp Frontend'e hızlıca ileten modül.
### 1.4. Async Worker & Queue Engine (Arka Plan İşçileri ve Mesaj Kuyruğu)
* Rol: Stok senkronizasyonu (FR7, FR11) ve ağır veri işleme görevlerini üstlenen asenkron sistem.
* Davranış: Core Engine'den bağımsız çalışır. Pazaryerlerinden gelen sipariş verilerini veya VentaHub'dan giden stok güncellemelerini alır, işler ve pazar yerlerine iletir.
### 1.5. Data Layer (Veri Katmanı)
* Primary Database (İlişkisel Veritabanı): Kullanıcılar, ürünler, siparişler ve finansal verilerin (ACID prensiplerine uygun) tutulduğu ana depo. Multi-tenant yapıda tasarlanmıştır.
* Caching Store (Önbellek): Dashboard verilerinin ve sık okunan konfigürasyonların milisaniyeler içinde sunulmasını sağlayan anahtar-değer (Key-Value) deposu.
---
## 2. Veri Akışı Diyagramları (Data Flow)
### 2.1. Otonom Stok Senkronizasyonu Akışı (Race Condition Korumalı)
1.  Tetiklenme: Pazaryeri A'dan (Örn: Trendyol) VentaHub'ın Webhook ucuna bir "Sipariş Geldi" bildirimi ulaşır veya Worker'lar düzenli yoklamayla (Polling) yeni siparişi çeker.
2.  Kuyruğa Alma: Sistem, gelen siparişi anında Order_Ingestion_Queue (Sipariş Kabul Kuyruğu) içine atar.
3.  İşleme ve Hesaplama: Bir Worker (İşçi) siparişi kuyruktan alır, Veritabanında genel stoğu 1 eksiltir. Aynı Worker, işlemi Core Engine'e iletip "Net Kâr" hesaplamasını (FR4) yaptırır ve kaydeder.
4.  Dağıtım Kuyruğu: Worker, yeni stok miktarını diğer pazaryerlerine (Örn: Hepsiburada) bildirmek üzere Stock_Update_Queue (Stok Güncelleme Kuyruğu) içine yeni bir olay (Event) bırakır.
5.  Dışa Aktarım (Outbound): Outbound Worker'lar, pazaryerinin Rate Limit kısıtlamalarına uyarak (Throttling) güncel stoğu pazar yerlerine iletir.
### 2.2. Güvenli API Anahtarı Kayıt Akışı
1.  Kullanıcı Frontend üzerinden API anahtarını girer.
2.  İstek API Gateway'den geçer, Core Engine'e (Auth & Tenant Manager) ulaşır.
3.  Core Engine, düz metin API anahtarını Key Management Service'e (KMS) gönderir.
4.  KMS anahtarı AES-256 ile şifreler (Ciphertext).
5.  Sadece şifrelenmiş metin (Ciphertext), KOBİ'nin Tenant ID'si ile Primary Database'e kaydedilir. Düz metin asla diske yazılmaz.
---
## 3. Teknik Kısıtlar ve Mimari Prensipler (Constraints & Principles)
* Veritabanı İzolasyonu: "Shared Database, Separate Schema" (Paylaşımlı Veritabanı, Ayrı Şema) veya en kötü ihtimalle "Tenant ID tabanlı Row Level Security" kullanılacaktır. Kod yazılırken (ORM seviyesinde) hiçbir sorgu Tenant ID parametresi olmadan çalıştırılamaz.
* Outbound Rate Limiting: Pazaryeri API limitleri aşıldığında sistem çökmeyecek, ancak işlemler birikecektir. Worker metrikleri (Kuyruktaki mesaj sayısı, Gecikme süresi) sürekli monitör edilecektir (Observability).
* Eventual Consistency (Nihai Tutarlılık): KOBİ'nin VentaHub ekranında gördüğü stok ile pazaryerindeki stok arasında, ağ gecikmelerinden dolayı 1-5 dakika arası bir "Tutarlılık Penceresi" olması mimari bir kabuldür (Near Real-Time).
* Stateless Services: Core Engine ve Worker modülleri kendi içlerinde durum (state) tutmaz. Bu sayede sunucu trafiği arttığında sistem yatayda istenildiği kadar ölçeklenebilir (Horizontal Scaling - NFR4).






