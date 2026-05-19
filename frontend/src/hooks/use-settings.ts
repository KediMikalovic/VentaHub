import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

export interface IntegrationSetting {
  id: string;
  platform: string;
  sellerId: string;
  apiKey: string;
  apiSecretMasked: string;
  isActive: boolean;
  webhookApiKey: string;
  lastSyncAt: string | null;
}

export interface ProfileSetting {
  companyName: string;
  industry: string;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
}

export interface SettingsData {
  profile: ProfileSetting;
  integrations: IntegrationSetting[];
}

const fetcher = (url: string) => axiosAuth.get(url).then((res) => res.data);

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<SettingsData>(
    '/api/integrations/settings',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate,
  };
}
