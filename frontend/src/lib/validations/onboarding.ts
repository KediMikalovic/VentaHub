import * as z from 'zod';

export const accountSchema = z.object({
  fullName: z.string().min(3, { message: "Ad Soyad en az 3 karakter olmalıdır." }),
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi giriniz." }),
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
});

export const companySchema = z.object({
  companyName: z.string().min(2, { message: "Firma adı en az 2 karakter olmalıdır." }),
  industry: z.string().min(1, { message: "Lütfen sektör seçiniz." }),
  storeSize: z.string().min(1, { message: "Lütfen mağaza büyüklüğü seçiniz." }),
});

export const integrationSchema = z.object({
  sellerId: z.string().min(1, { message: "Trendyol Satıcı ID zorunludur." }),
  apiKey: z.string().min(1, { message: "API Key zorunludur." }),
  apiSecret: z.string().min(1, { message: "API Secret zorunludur." }),
});
