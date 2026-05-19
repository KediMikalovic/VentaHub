import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
  currentStep: number;
  accountData: Record<string, any>;
  companyData: Record<string, any>;
  integrationData: Record<string, any>;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setAccountData: (data: Record<string, any>) => void;
  setCompanyData: (data: Record<string, any>) => void;
  setIntegrationData: (data: Record<string, any>) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      accountData: {},
      companyData: {},
      integrationData: {},
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      setAccountData: (data) => set({ accountData: data }),
      setCompanyData: (data) => set({ companyData: data }),
      setIntegrationData: (data) => set({ integrationData: data }),
      resetOnboarding: () => set({ currentStep: 1, accountData: {}, companyData: {}, integrationData: {} }),
    }),
    {
      name: 'ventahub-onboarding-storage',
    }
  )
);
