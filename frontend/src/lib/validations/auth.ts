import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi giriniz." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
});
