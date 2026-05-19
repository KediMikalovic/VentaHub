import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

export type Period = 'daily' | 'weekly' | 'monthly';

export interface FinanceKPIs {
  totalRevenue: number;
  totalCommission: number;
  totalShippingCost: number;
  totalNetProfit: number;
  profitMargin: number;
}

export interface FinanceChartPoint {
  date: string;
  ciro: number;
  kar: number;
  komisyon: number;
}

export interface LedgerRow {
  id: string;
  transactionId: string;
  orderNumber: string;
  orderDate: string;
  platform: string;
  sellerRevenue: number;
  commissionAmount: number;
  cargoExpense: number;
  returnCargoExpense: number;
  netProfit: number;
  settlementStatus: 'PENDING' | 'PAID';
  expectedPaymentDate: string | null;
}

const fetcher = (url: string) => axiosAuth.get(url).then((r) => r.data);

export function useFinanceSummary(period: Period) {
  const { data, error, isLoading } = useSWR<{
    period: Period;
    kpis: FinanceKPIs;
    chartData: FinanceChartPoint[];
  }>(`/api/finance/summary?period=${period}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    kpis: data?.kpis,
    chartData: data?.chartData ?? [],
    isLoading,
    isError: error,
  };
}

export function useFinanceLedger() {
  const { data, error, isLoading } = useSWR<{ ledger: LedgerRow[] }>(
    '/api/finance/ledger',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    ledger: data?.ledger ?? [],
    isLoading,
    isError: error,
  };
}
