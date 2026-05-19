"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { accountSchema } from "@/lib/validations/onboarding";
import { useOnboardingStore } from "@/store/useOnboardingStore";
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

export function Step1Account() {
  const { accountData, setAccountData, nextStep } = useOnboardingStore();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: accountData.fullName || "",
      email: accountData.email || "",
      password: accountData.password || "",
    },
  });

  function onSubmit(values: z.infer<typeof accountSchema>) {
    setAccountData(values);
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad</FormLabel>
                <FormControl>
                  <Input placeholder="Berke Yılmaz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta Adresi</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="berke@example.com" {...field} />
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
                <FormLabel>Şifre</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">İleri</Button>
        </div>
      </form>
    </Form>
  );
}
