import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

export type OrderStatus = 'Created' | 'Picking' | 'Shipped' | 'Delivered' | 'Cancelled' | string;

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  totalAmount: number;
  status: OrderStatus;
  cargoProvider: string;
  source?: string;
}

const fetcher = (url: string) => axiosAuth.get(url).then((res) => res.data);

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR<{ orders: Order[] }>(
    '/api/orders',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    orders:   data?.orders ?? [],
    isLoading,
    isError:  error,
    mutate,
  };
}
