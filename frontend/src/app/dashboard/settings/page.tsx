"use client";

import { useState, useEffect } from "react";
import { useSettings, IntegrationSetting } from "@/hooks/use-settings";
import axiosAuth from "@/lib/axios-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Store,
  KeyRound,
  Webhook,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading, isError, mutate } = useSettings();
  const { toast } = useToast();

  // Aktif Sekme
  const [activeTab, setActiveTab] = useState<"profile" | "integrations" | "webhook">("profile");

  // ── Form State'leri ────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Entegrasyon Form State
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationSetting | null>(null);
  const [sellerId, setSellerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Panoya Kopyalama Durumu
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // API'den gelen verileri state'e yükle
  useEffect(() => {
    if (settings?.profile) {
      setCompanyName(settings.profile.companyName || "");
      setIndustry(settings.profile.industry || "");
    }
    if (settings?.integrations && settings.integrations.length > 0) {
      const trendyol = settings.integrations.find((i) => i.platform === "TRENDYOL") || settings.integrations[0];
      setSelectedIntegration(trendyol);
      setSellerId(trendyol.sellerId || "");
      setApiKey(trendyol.apiKey || "");
      setApiSecret(""); // Düz metin olmadığı için boş başlatıyoruz (Değiştirmek isterse doldurur)
      setIsActive(trendyol.isActive ?? true);
    }
  }, [settings]);

  // ── Profili Kaydet ─────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await axiosAuth.patch("/api/integrations/settings/profile", {
        companyName,
        industry,
      });
      await mutate();
      toast({
        title: "✅ Profil Güncellendi",
        description: "Mağaza ve şirket bilgileriniz başarıyla kaydedildi.",
      });
    } catch (err: any) {
      toast({
        title: "❌ Güncelleme Hatası",
        description: err?.response?.data?.message || "Profil kaydedilemedi.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Entegrasyon Kimlik Bilgilerini Kaydet ──────────────────────────────────
  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    setSavingIntegration(true);
    try {
      const payload: any = { sellerId, isActive };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();
      if (apiSecret.trim()) payload.apiSecret = apiSecret.trim();

      await axiosAuth.patch(`/api/integrations/settings/${selectedIntegration.id}`, payload);
      await mutate();
      
      // Şifre alanını temizle
      setApiSecret("");
      
      toast({
        title: "🛡️ Entegrasyon Zırhlandı",
        description: "API anahtarlarınız AES-256 standardında şifrelenerek kaydedildi.",
      });
    } catch (err: any) {
      toast({
        title: "❌ Kayıt Hatası",
        description: err?.response?.data?.message || "Entegrasyon bilgileri güncellenemedi.",
        variant: "destructive",
      });
    } finally {
      setSavingIntegration(false);
    }
  };

  // ── Kopyalama Fonksiyonları ────────────────────────────────────────────────
  const copyToClipboard = (text: string, type: "url" | "key") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    toast({
      title: "📋 Panoya Kopyalandı",
      description: "Bilgiyi Trendyol satıcı panelinize yapıştırabilirsiniz.",
    });
  };

  // Webhook URL'sini dinamik olarak oluştur
  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/integrations/trendyol/webhook`
    : "https://.../api/integrations/trendyol/webhook";

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ayarlar Yüklenemedi</h2>
        <p className="text-sm text-slate-500">Sunucu ile bağlantı kurulamadı. Lütfen tekrar deneyin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      
      {/* ── Üst Başlık ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sistem Ayarları</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mağaza profilinizi, güvenli API şifrelerinizi ve canlı bildirim webhook&apos;larını yönetin.
        </p>
      </div>

      {/* ── Güvenlik Banner'ı (Global Kurallar Vurgusu) ─────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm mt-0.5 sm:mt-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">AES-256 Askeri Düzey Şifreleme Aktif</h4>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              VentaHub, çoklu kiracı (Multi-Tenant) izolasyon kuralları gereği API anahtarlarınızı asla düz metin olarak veritabanına yazmaz. Tüm anahtarlar <strong>Envelope Encryption</strong> standardıyla şifrelenir.
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs shrink-0 shadow-sm">
          Zırhlı Veri İzolasyonu
        </Badge>
      </div>

      {/* ── İçerik Düzeni (Sol: Dikey Menü, Sağ: Formlar) ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Sol Menü */}
        <Card className="border-slate-200 bg-white md:col-span-1 p-2 shadow-sm">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                activeTab === "profile" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Store className={cn("h-4 w-4", activeTab === "profile" ? "text-white" : "text-slate-500")} />
              <span>Mağaza Profili</span>
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                activeTab === "integrations" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <KeyRound className={cn("h-4 w-4", activeTab === "integrations" ? "text-white" : "text-slate-500")} />
              <span>API Kimlik Bilgileri</span>
            </button>

            <button
              onClick={() => setActiveTab("webhook")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                activeTab === "webhook" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Webhook className={cn("h-4 w-4", activeTab === "webhook" ? "text-white" : "text-slate-500")} />
              <span>Canlı Webhook</span>
            </button>
          </nav>
        </Card>

        {/* Sağ Panel */}
        <div className="md:col-span-3">
          
          {/* ── 1. MAĞAZA PROFİLİ ───────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">Mağaza ve Firma Profili</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Şirketinizin unvanını ve faaliyet gösterdiği sektörü tanımlayın.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Plan Bilgisi */}
                      <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-medium text-slate-500">Mevcut Abonelik Planı</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {settings?.profile?.subscriptionPlan || "PRO"} Paket
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                          {settings?.profile?.status === "ACTIVE" ? "🟢 Aktif" : "🔴 Askıda"}
                        </Badge>
                      </div>

                      {/* Firma Adı */}
                      <div className="flex flex-col gap-2 col-span-2">
                        <Label htmlFor="companyName" className="text-xs font-semibold text-slate-700">
                          Firma / Mağaza Adı
                        </Label>
                        <Input
                          id="companyName"
                          placeholder="Örn: Truva E-Ticaret A.Ş."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Sektör */}
                      <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="industry" className="text-xs font-semibold text-slate-700">
                          Sektör
                        </Label>
                        <Input
                          id="industry"
                          placeholder="Örn: Tekstil, Elektronik"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Kayıt Tarihi */}
                      <div className="flex flex-col gap-2 col-span-2 sm:col-span-1 justify-end">
                        <Label className="text-xs font-semibold text-slate-400">
                          Sisteme Kayıt Tarihi
                        </Label>
                        <div className="h-10 flex items-center px-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-500 font-mono">
                          {settings?.profile?.createdAt 
                            ? new Date(settings.profile.createdAt).toLocaleDateString("tr-TR") 
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6 text-sm shadow-sm"
                      >
                        {savingProfile ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...
                          </>
                        ) : (
                          "Değişiklikleri Kaydet"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── 2. API KİMLİK BİLGİLERİ ─────────────────────────────────────── */}
          {activeTab === "integrations" && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Pazaryeri API Bağlantısı</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Trendyol REST API kimlik bilgilerinizi güvenle güncelleyin.
                  </CardDescription>
                </div>
                <Badge className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-50 text-xs font-bold">
                  Trendyol REST API
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !selectedIntegration ? (
                  <div className="text-center py-8 text-sm text-slate-400">
                    Kayıtlı pazaryeri entegrasyonu bulunamadı.
                  </div>
                ) : (
                  <form onSubmit={handleSaveIntegration} className="flex flex-col gap-5">
                    
                    <div className="flex flex-col gap-4">
                      
                      {/* Senkronizasyon Durumu */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                          <div>
                            <p className="text-xs font-bold text-slate-700">Bağlantı Durumu</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Son Senkronizasyon:{" "}
                              {selectedIntegration.lastSyncAt 
                                ? new Date(selectedIntegration.lastSyncAt).toLocaleString("tr-TR") 
                                : "Henüz senkronize edilmedi"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsActive(!isActive)}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition-colors border",
                            isActive 
                              ? "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
                              : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {isActive ? "Entegrasyonu Duraklat" : "Bağlantıyı Başlat"}
                        </button>
                      </div>

                      {/* Satıcı ID */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="sellerId" className="text-xs font-semibold text-slate-700">
                          Trendyol Satıcı ID (Seller ID)
                        </Label>
                        <Input
                          id="sellerId"
                          placeholder="Örn: 123456"
                          value={sellerId}
                          onChange={(e) => setSellerId(e.target.value)}
                          required
                          className="h-10 text-sm font-mono"
                        />
                        <p className="text-[11px] text-slate-400">
                          Trendyol satıcı panelinizin sağ üst köşesindeki mağaza numaranızdır.
                        </p>
                      </div>

                      {/* API Anahtarı */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="apiKey" className="text-xs font-semibold text-slate-700">
                          API Anahtarı (API Key)
                        </Label>
                        <Input
                          id="apiKey"
                          placeholder="Yeni API anahtarı girin..."
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="h-10 text-sm font-mono text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400">
                          Mevcut şifreli anahtar: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{selectedIntegration.apiKey || "Tanımsız"}</span>. Sadece değiştirmek isterseniz doldurun.
                        </p>
                      </div>

                      {/* API Sırrı */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="apiSecret" className="text-xs font-semibold text-slate-700">
                          API Sırrı (API Secret)
                        </Label>
                        <div className="relative">
                          <Input
                            id="apiSecret"
                            type={showSecret ? "text" : "password"}
                            placeholder="•••••••••••••••• (Yeni şifre belirleyin)"
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            className="h-10 text-sm font-mono pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                          <ShieldCheck className="h-3 w-3" /> Bellekte (RAM) anlık olarak AES-256 ile şifrelenir.
                        </p>
                      </div>

                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingIntegration}
                        className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6 text-sm shadow-sm"
                      >
                        {savingIntegration ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Şifreleniyor...
                          </>
                        ) : (
                          "API Bilgilerini Güncelle"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── 3. CANLI WEBHOOK ────────────────────────────────────────────── */}
          {activeTab === "webhook" && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">Anlık Sipariş Bildirimleri (Webhook)</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Trendyol sisteminin yeni siparişleri anında VentaHub&apos;a iletmesi için aşağıdaki ayarları tanımlayın.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                
                {/* Info Kutusu */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
                  Trendyol Satıcı Paneli ➔ <strong>Hesabım</strong> ➔ <strong>Entegrasyon Bilgileri</strong> sekmesine gidin. <strong>Sipariş Bildirim (Webhook)</strong> ayarlarını açarak aşağıdaki URL ve yetkilendirme anahtarını ilgili alanlara yapıştırın.
                </div>

                {/* Webhook URL */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Sipariş Bildirim URL&apos;si (Webhook Endpoint)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center overflow-x-auto text-xs font-mono text-slate-700 select-all">
                      {webhookUrl}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookUrl, "url")}
                      className="h-10 px-3 shrink-0 border-slate-200 hover:bg-slate-50"
                    >
                      {copiedUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    </Button>
                  </div>
                </div>

                {/* Webhook Authorization Key */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Yetkilendirme Anahtarı (Authorization Key)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center text-xs font-mono text-slate-700 select-all">
                      {selectedIntegration?.webhookApiKey || "v-hub_test_secret_key_2026"}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedIntegration?.webhookApiKey || "v-hub_test_secret_key_2026", "key")}
                      className="h-10 px-3 shrink-0 border-slate-200 hover:bg-slate-50"
                    >
                      {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Webhook isteklerinin güvenliğini sağlamak için Trendyol istek başlığına bu anahtarı ekleyecektir.
                  </p>
                </div>

                {/* Fast ACK Açıklaması */}
                <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Mimari Yanıt Süresi: <strong>&lt; 50ms (Fast ACK)</strong></span>
                  <a
                    href="https://developers.trendyol.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Trendyol Dokümantasyonu <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
