import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

export interface ReturnItem {
  id: string;
  claimId: string;
  claimLineItemId: string;
  orderNumber: string;
  platform: string;
  productName: string;
  productSku: string;
  claimItemStatus: string;
  customerNote: string | null;
  requestedAt: string | null;
  hoursElapsed: number | null;
  isSlaRisk: boolean;
  createdAt: string;
}

export interface ReturnStats {
  total: number;
  slaRisk: number;
  byStatus: { status: string; count: number }[];
}

const fetcher = (url: string) => axiosAuth.get(url).then((r) => r.data);

export function useReturns() {
  const { data, error, isLoading, mutate } = useSWR<{
    returns: ReturnItem[];
    slaRiskCount: number;
  }>('/api/returns', fetcher, { revalidateOnFocus: false });

  return {
    returns:      data?.returns ?? [],
    slaRiskCount: data?.slaRiskCount ?? 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useReturnStats() {
  const { data, error, isLoading, mutate } = useSWR<ReturnStats>(
    '/api/returns/stats',
    fetcher,
    { revalidateOnFocus: false },
  );

  return { stats: data, isLoading, isError: error, mutate };
}
