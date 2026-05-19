"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { companySchema } from "@/lib/validations/onboarding";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Step2Company() {
  const { companyData, setCompanyData, nextStep, prevStep } = useOnboardingStore();

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: companyData.companyName || "",
      industry: companyData.industry || "",
      storeSize: companyData.storeSize || "",
    },
  });

  function onSubmit(values: z.infer<typeof companySchema>) {
    setCompanyData(values);
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma / Mağaza Adı</FormLabel>
                <FormControl>
                  <Input placeholder="VentaHub Store" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sektör</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sektör seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Teknoloji">Teknoloji</SelectItem>
                    <SelectItem value="Giyim">Giyim</SelectItem>
                    <SelectItem value="Kozmetik">Kozmetik</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storeSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aylık Sipariş Hacmi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Hacim seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1-50">1 - 50</SelectItem>
                    <SelectItem value="51-500">51 - 500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep}>
            Geri
          </Button>
          <Button type="submit">İleri</Button>
        </div>
      </form>
    </Form>
  );
}
