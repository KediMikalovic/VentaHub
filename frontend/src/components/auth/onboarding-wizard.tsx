"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Step1Account } from "./steps/step-1-account";
import { Step2Company } from "./steps/step-2-company";
import { Step3Integration } from "./steps/step-3-integration";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingWizard() {
  const { currentStep } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  // Hydration hatasını önlemek için (Zustand persist ile SSR uyumu)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <Card className="w-full max-w-lg border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {currentStep === 1 && "Hesap Bilgileri"}
            {currentStep === 2 && "Firma Detayları"}
            {currentStep === 3 && "Trendyol Entegrasyonu"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "VentaHub'a giriş yapabilmeniz için bilgilerinizi girin."}
            {currentStep === 2 && "İşletmenizi daha iyi tanımamız için detayları paylaşın."}
            {currentStep === 3 && "Güvenli bağlantı için API bilgilerinizi tanımlayın."}
          </CardDescription>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Adım {currentStep} / 3</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        {currentStep === 1 && <Step1Account />}
        {currentStep === 2 && <Step2Company />}
        {currentStep === 3 && <Step3Integration />}
      </CardContent>
    </Card>
  );
}
