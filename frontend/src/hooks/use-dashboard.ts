import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

const fetcher = (url: string) => axiosAuth.get(url).then((res) => res.data);

export function useDashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/dashboard/summary',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    dashboardData: data,
    isLoading,
    isError: error,
  };
}
