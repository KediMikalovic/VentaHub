import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stockQuantity: number;
  costPrice: number;
  salePrice: number;
}

const fetcher = (url: string) => axiosAuth.get(url).then((res) => res.data);

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<{ products: Product[] }>(
    '/api/products',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    products: data?.products ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
