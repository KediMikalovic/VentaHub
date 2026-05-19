import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      
      {/* Sol Panel - Değer Önerisi (Value Proposition) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-10 w-10"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          <span className="ml-2 text-2xl font-bold">VentaHub</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-6">
            <p className="text-3xl font-bold leading-tight">
              E-ticaret operasyonlarınızı otopilota bağlayın.
            </p>
            <div className="space-y-4 text-primary-foreground/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <span>Otonom stok ve fiyat senkronizasyonu</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <span>Sıfır hata ile çoklu pazaryeri yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <span>Gerçek zamanlı kâr ve ciro analizleri</span>
              </div>
            </div>
          </blockquote>
        </div>
      </div>

      {/* Sağ Panel - Form Sihirbazı */}
      <div className="flex flex-col items-center justify-center p-4 lg:p-8 h-full">
        <div className="w-full max-w-[450px]">
          <OnboardingWizard />
        </div>
      </div>
    </div>
  );
}
