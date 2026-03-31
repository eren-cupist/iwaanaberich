import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  getTradingStatus,
  triggerAnalysis,
  getTradingConfig,
  updateTradingConfig,
  saveUpbitKeys,
  getUpbitAccounts,
  getUpbitKeysStatus,
  getProfitLossSummary,
  getTradeHistory,
  TradingConfig,
} from "../lib/api";

// === Query Keys ===

export const queryKeys = {
  me: ["me"] as const,
  tradingStatus: ["tradingStatus"] as const,
  tradingConfig: ["tradingConfig"] as const,
  upbitKeysStatus: ["upbitKeysStatus"] as const,
  upbitAccounts: ["upbitAccounts"] as const,
  profitLossSummary: (days: number) => ["profitLossSummary", days] as const,
  tradeHistory: (limit: number) => ["tradeHistory", limit] as const,
};

// === Query Hooks ===

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
  });
}

export function useTradingStatus() {
  return useQuery({
    queryKey: queryKeys.tradingStatus,
    queryFn: getTradingStatus,
  });
}

export function useTradingConfig() {
  return useQuery({
    queryKey: queryKeys.tradingConfig,
    queryFn: getTradingConfig,
  });
}

export function useUpbitKeysStatus() {
  return useQuery({
    queryKey: queryKeys.upbitKeysStatus,
    queryFn: getUpbitKeysStatus,
  });
}

export function useUpbitAccounts(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.upbitAccounts,
    queryFn: getUpbitAccounts,
    enabled,
  });
}

export function useProfitLossSummary(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.profitLossSummary(days),
    queryFn: () => getProfitLossSummary(days),
  });
}

export function useTradeHistory(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.tradeHistory(limit),
    queryFn: () => getTradeHistory(limit),
  });
}

// === Mutation Hooks ===

export function useTriggerAnalysis() {
  return useMutation({
    mutationFn: (market: string) => triggerAnalysis(market),
  });
}

export function useUpdateTradingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<TradingConfig>) => updateTradingConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradingConfig });
    },
  });
}

export function useSaveUpbitKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { accessKey?: string; secretKey?: string }) => saveUpbitKeys(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upbitKeysStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.upbitAccounts });
    },
  });
}
