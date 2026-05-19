import { redirect } from 'next/navigation';

// Kök rota ( / ) → /login'e yönlendir
export default function RootPage() {
  redirect('/login');
}
