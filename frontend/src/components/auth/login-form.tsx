"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { loginSchema } from "@/lib/validations/auth";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', values);
      
      const token = response.data?.access_token;
      
      if (token) {
        // Token'ı Cookie'ye yazıyoruz, 1 gün ömürlü. 
        Cookies.set('access_token', token, { expires: 1, path: '/' });
        
        toast({
          title: "Giriş Başarılı",
          description: "Yönlendiriliyorsunuz...",
        });

        router.push('/dashboard');
      } else {
        throw new Error("Token alınamadı.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.response?.status === 401 
          ? "E-posta veya şifre hatalı." 
          : "Sistemsel bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Hesabınıza Giriş Yapın
        </CardTitle>
        <CardDescription>
          VentaHub paneline erişmek için e-posta ve şifrenizi girin.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ornek@firma.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Şifre</FormLabel>
                    <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                      Şifremi Unuttum
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <div className="text-sm text-center w-full text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Kayıt Olun
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
