"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { integrationSchema } from "@/lib/validations/onboarding";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Step3Integration() {
  const { integrationData, setIntegrationData, accountData, companyData, prevStep, resetOnboarding } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      sellerId: integrationData.sellerId || "",
      apiKey: integrationData.apiKey || "",
      apiSecret: integrationData.apiSecret || "",
    },
  });

  async function onSubmit(values: z.infer<typeof integrationSchema>) {
    setIntegrationData(values);
    setIsLoading(true);

    try {
      // Backend'in veritabanı şemasına uygun payload hazırlığı
      // Prisma şemamıza göre:
      // companyName, industry, fullName, email, passwordHash (Backend hashlineyecek)
      // sellerId, encryptedApiKey, encryptedApiSecret (Backend şifreleyecek)
      const payload = {
        fullName: accountData.fullName,
        email: accountData.email,
        password: accountData.password,
        companyName: companyData.companyName,
        industry: companyData.industry,
        storeSize: companyData.storeSize,
        platform: "TRENDYOL",
        sellerId: values.sellerId,
        apiKey: values.apiKey,
        apiSecret: values.apiSecret,
      };

      // Bu endpoint mock/gerçek Backend API Proxy yönlendirmesiyle çalışacak
      const response = await axios.post('/api/auth/register', payload);

      toast({
        title: "Kayıt Başarılı! 🎉",
        description: "VentaHub'a hoş geldiniz. Yönlendiriliyorsunuz...",
      });

      resetOnboarding();
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: error.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trendyol Satıcı ID</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: 123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Trendyol API Key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Secret</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Trendyol API Secret" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
            Geri
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : "Kaydı Tamamla"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
