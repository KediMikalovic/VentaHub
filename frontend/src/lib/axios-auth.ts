/**
 * axiosAuth — Otomatik olarak access_token cookie'sini
 * Authorization: Bearer <token> header'ına dönüştüren axios instance'ı.
 *
 * NestJS JwtStrategy, ExtractJwt.fromAuthHeaderAsBearerToken() kullandığı için
 * withCredentials ile cookie göndermek yetmiyor; header'a elle koymak gerekiyor.
 */
import axios from 'axios';

const axiosAuth = axios.create();

axiosAuth.interceptors.request.use((config) => {
  // js-cookie SSR'de import edilemiyor, sadece tarayıcıda çalışır
  if (typeof document !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1];

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

export default axiosAuth;
