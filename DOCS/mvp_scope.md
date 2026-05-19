# VentaHub - MVP Kapsamı (mvp_scope.md)
Sürüm: MVP (V0.1)  
Odak: Sadece Kanayan Yarayı Sarmak (Stok Senkronizasyonu ve Temel Kârlılık)
---
## 1. MoSCoW Analizi Özeti
Geliştirme eforunu korumak adına özellikler acımasızca elenmiştir.
* Must-Have (MVP'de KESİNLİKLE Olacak): Temel API altyapısı, stok senkronizasyonu (FR7), otomatik stok güncellemeleri (FR11'in yalın hali), basit kâr hesaplama (FR4), özet Dashboard (FR1).
* Should-Have (Canlıya Çıkıştan Hemen Sonra - V1.1): En çok iade/kâr getiren ürün listeleri (FR3), kârlılık karşılaştırmaları (FR6).
* Could-Have (Gelecek Vizyonu - V2.0): Emniyet stoğu hesaplama (FR8), akıllı uyarılar (FR2, FR9), gizli maliyet raporları (FR5). (Not: FR8 için zaten elimizde anlamlı bir geçmiş veri (historical data) olmayacak. İlk gün yapılamaz.)
* Won't-Have (Şu An İçin Çöpe Atılanlar): IFTTT kural setleri (FR10), dinamik fiyatlandırma (FR12). (Not: Bu özelliklerin test maliyeti ve teknik riski MVP aşamasında bütçeyi batırır.)
---
## 2. MVP Kapsamı ve Teknik Risk Analizi (Öncelik Sırasına Göre)
Aşağıdaki iş paketleri, geliştirme sırasına göre listelenmiştir. Biri bitmeden diğerine geçilmeyecektir.
### Öncelik 1: Güvenli Altyapı ve API Oturumu (NFR2)
* Kapsam: Kullanıcıların sisteme kaydolması, Multi-tenant (çoklu kiracı) veritabanı mimarisinin kurulması ve pazaryeri API anahtarlarının (Trendyol, Hepsiburada vb.) AES-256 ile güvenli bir şekilde kaydedilmesi.
* **Teknik Risk:** Yüksek. Veri izolasyonunu ilk günden doğru kuramazsak ileride tüm sistemi baştan yazmak zorunda kalırız. API rate-limit (istek sınırı) stratejileri burada kurgulanmalı.
### Öncelik 2: Otonom Stok Senkronizasyonu (FR7 & FR11 - Yalın Versiyon)
* Kapsam: Platform A'da bir ürün satıldığında, VentaHub'ın bunu algılayıp anında Platform B'deki stoğu düşürmesi. Kullanıcının tek bir arayüzden stok/fiyat güncellemesini tüm pazaryerlerine gönderebilmesi.
* **Teknik Risk:** Çok Yüksek. Pazaryeri API'larının anlık çökmesi veya gecikmesi durumunda yaşanacak "Race Condition" (aynı anda iki yerden sipariş gelmesi) sorunları. Hata toleransı (Retry mekanizmaları) çok iyi kurgulanmalı. Bu, ürünün belkemiğidir.
### Öncelik 3: Temel Kârlılık Motoru (FR4)
* Kapsam: Sipariş API'sından gelen brüt satış rakamından; bilinen pazaryeri komisyon oranını ve sabit kargo barem maliyetlerini çıkararak sipariş bazlı "Tahmini Net Kâr" hesaplamak. 
* **Teknik Risk:** Orta. Pazaryerlerinden gelen veriler her zaman temiz değildir. Dinamik vergi oranları ve dönemsel kargo indirimlerini yönetmek için esnek bir hesaplama tablosu (lookup table) gerektirir. İlk etapta tahmini maliyetlere odaklanılacak, %100 kuruşu kuruşuna doğruluk aranmayacaktır.
### Öncelik 4: Yalın Dashboard (FR1 & NFR1, NFR3)
* Kapsam: Kullanıcı giriş yaptığında karmaşadan uzak, "Bugün ne sattım?", "Tahmini Net Kârım ne?" ve "Sistemde stok eşitleme hatası var mı?" sorularının cevabını 2 saniyenin altında yüklenen modern bir sayfada görmek.
* **Teknik Risk:** Düşük. Arka plandaki veriler düzgün akıyorsa front-end tarafında veri görselleştirmek (Chart.js vb.) kolaydır. Performans (NFR1) burada önbellekleme (Caching) stratejileriyle çözülebilir.