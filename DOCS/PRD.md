# VentaHub - Ürün Gereksinim Dokümanı (PRD)
Sürüm: 1.0  
Statü: Taslak / Onay Bekliyor  
Rol: Senior Product Manager  
## 1. Vizyon ve Ürün Özeti
VentaHub, KOBİ'lerin farklı e-ticaret pazaryerlerindeki operasyonlarını tek bir merkezden yönetmelerini sağlayan, sadece veri sunan değil, mühendislik yaklaşımlarıyla (Emniyet stoğu, akıllı maliyet analizi vb.) operasyonu optimize eden ve otonomlaştıran "Premium" bir e-ticaret yönetim platformudur.
## 2. User Personas (Kullanıcı Personaları)
### 2.1. Büyüme Odaklı Butik Girişimci
* Profil: Günde 20-50 arası sipariş alan, operasyonu küçük bir ekiple yöneten işletme sahibi.
* İhtiyaç: Zaman kazanmak ve "Gerçekten ne kadar kâr ediyorum?" sorusunun yanıtını net görmek.
* Hedef: Karmaşık finansal verileri (komisyon, iade maliyeti, vergi) basit ve anlaşılır bir arayüzle takip etmek.
### 2.2. Veri Odaklı Operasyon Yöneticisi
* Profil: Günde 500+ sipariş işleyen, çok sayıda SKU yöneten profesyonel yönetici.
* İhtiyaç: Hatasız stok senkronizasyonu ve manuel iş yükünü sıfırlayacak otomasyonlar.
* Hedef: Emniyet stoğu gibi bilimsel yöntemlerle "stoksuz kalma" (out-of-stock) riskini minimize etmek.
## 3. Functional Requirements (Fonksiyonel Gereksinimler)
### 3.1. Dashboard (Özet Paneli)
* FR1: Günlük, haftalık ve aylık konsolide satış, net kâr ve iade oranlarını göstermelidir.
* FR2: Stok seviyesi kritik eşiğin altına düşen ürünler için akıllı uyarı sistemi barındırmalıdır.
* FR3: En çok kâr getiren ve en çok iade edilen ürünleri listelemelidir.
### 3.2. Finans Modülü
* FR4: Pazaryeri API'larından gelen verilerle; komisyon, kargo, hizmet bedeli ve vergileri otomatik düşerek "Net Kâr" hesaplamalıdır.
* FR5: İade süreçlerinin yarattığı "görünmeyen maliyetleri" (lojistik cezalar, operasyonel kayıplar) raporlamalıdır.
* FR6: Farklı pazaryerlerinin kârlılık oranlarını karşılaştırmalı olarak sunmalıdır.
### 3.3. Envanter Yönetimi
* FR7: Tek merkezden tüm pazaryerlerine fiyat ve stok güncellemesi gönderebilmelidir.
* FR8: Mühendislik yaklaşımlarıyla (Sales Velocity) her SKU için "Emniyet Stoğu" (Safety Stock) hesaplamalıdır.
* FR9: Kritik stok seviyelerinde kullanıcıya tedarik önerisinde bulunmalıdır.
### 3.4. Otomasyon Sayfası
* FR10: Kullanıcıların "Eğer X olursa, Y aksiyonunu al" şeklinde kural setleri oluşturmasına izin vermelidir.
* FR11: Pazaryerleri arasındaki stok senkronizasyonunu otonom (insansız) yürütmelidir.
* FR12: Belirlenen kurallara göre (Örn: Stok 5'in altına düşerse fiyatı %10 artır) dinamik fiyatlandırma yapabilmelidir.
## 4. Non-Functional Requirements (Sistem Kalite Gereksinimleri)
* NFR1 (Performans): Sayfa yüklenme hızları ve veri görselleştirme bileşenleri 2 saniyenin altında tepki vermelidir.
* NFR2 (Güvenlik): Pazaryeri API anahtarları AES-256 şifreleme ile saklanmalı ve Multi-tenant veri izolasyonu sağlanmalıdır.
* NFR3 (Kullanılabilirlik): "Premium Product" algısını destekleyen, minimalist ve modern bir UI/UX tasarımı uygulanmalıdır.
* NFR4 (Ölçeklenebilirlik): Sistem, kampanya dönemlerindeki (Black Friday vb.) 10x trafik artışını kesintisiz yönetebilmelidir.
## 5. Success Metrics (Başarı Metrikleri)
* SM1: Otomasyon modülünü aktif kullanan kullanıcı oranı (Hedef: >%60).
* SM2: Kullanıcıların stok yetersizliği nedeniyle iptal edilen sipariş sayısındaki azalma oranı.
* SM3: Haftalık Aktif Kullanıcı (WAU) sayısı ve platformda geçirilen ortalama süre.
* SM4: Ücretsiz deneme (Trial) sürümünden ücretli paketlere geçiş (Conversion) oranı.
* SM5: Müşteri başına ortalama gelir (ARPU) ve MRR büyüme hızı.