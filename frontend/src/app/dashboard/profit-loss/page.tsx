"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

interface DailyPnl {
  id: string;
  date: string;
  totalBuyAmount: string;
  totalSellAmount: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalFees: string;
  tradeCount: number;
  portfolioValue: string;
  aiSummary: string | null;
}

export default function ProfitLossPage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<DailyPnl[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (session?.backendToken) {
      axiosInstance.get(`/profit-loss/summary?days=${days}`)
        .then((res) => setRecords(res.data.records || []))
        .catch(() => {});
    }
  }, [session, days]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr;</Link>
            <h1 className="text-2xl font-bold text-white">일별 수익/손실</h1>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-sm ${
                  days === d ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>

        {/* 일별 기록 */}
        <div className="space-y-3">
          {records.map((record) => {
            const pnl = parseFloat(record.realizedPnl);
            const isProfit = pnl >= 0;

            return (
              <div key={record.id} className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {new Date(record.date).toLocaleDateString("ko-KR")}
                  </span>
                  <span className={`text-lg font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                    {isProfit ? "+" : ""}{pnl.toLocaleString()}원
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">매수</span>
                    <div className="text-slate-300">{parseFloat(record.totalBuyAmount).toLocaleString()}원</div>
                  </div>
                  <div>
                    <span className="text-slate-500">매도</span>
                    <div className="text-slate-300">{parseFloat(record.totalSellAmount).toLocaleString()}원</div>
                  </div>
                  <div>
                    <span className="text-slate-500">수수료</span>
                    <div className="text-slate-300">{parseFloat(record.totalFees).toLocaleString()}원</div>
                  </div>
                  <div>
                    <span className="text-slate-500">거래 수</span>
                    <div className="text-slate-300">{record.tradeCount}건</div>
                  </div>
                </div>

                {record.aiSummary && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-400">
                    {record.aiSummary}
                  </div>
                )}
              </div>
            );
          })}

          {records.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              수익/손실 기록이 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
