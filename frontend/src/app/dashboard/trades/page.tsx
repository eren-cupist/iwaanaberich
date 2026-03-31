"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

interface Trade {
  id: string;
  market: string;
  side: string;
  orderType: string;
  price: string | null;
  volume: string;
  executedVolume: string | null;
  executedAmount: string | null;
  fee: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
}

export default function TradesPage() {
  const { data: session } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);

  const backendToken = session?.backendToken;

  useEffect(() => {
    if (backendToken) {
      axiosInstance.get("/trading/history?limit=50")
        .then((res) => setTrades(res.data))
        .catch(() => {});
    }
  }, [backendToken]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr;</Link>
          <h1 className="text-2xl font-bold text-white">거래 이력</h1>
        </div>

        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-slate-500">시간</th>
                <th className="px-4 py-3 text-left text-slate-500">마켓</th>
                <th className="px-4 py-3 text-left text-slate-500">방향</th>
                <th className="px-4 py-3 text-right text-slate-500">금액</th>
                <th className="px-4 py-3 text-right text-slate-500">수수료</th>
                <th className="px-4 py-3 text-left text-slate-500">상태</th>
                <th className="px-4 py-3 text-left text-slate-500">사유</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(trade.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 font-mono">{trade.market}</td>
                  <td className="px-4 py-3">
                    <span className={trade.side === "BUY" ? "text-green-400" : "text-red-400"}>
                      {trade.side === "BUY" ? "매수" : "매도"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trade.executedAmount
                      ? `${parseFloat(trade.executedAmount).toLocaleString()}원`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {trade.fee ? `${parseFloat(trade.fee).toLocaleString()}원` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={trade.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                    {trade.reason || "-"}
                  </td>
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    거래 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    FILLED: "bg-green-900/50 text-green-400",
    PENDING: "bg-yellow-900/50 text-yellow-400",
    SUBMITTED: "bg-blue-900/50 text-blue-400",
    FAILED: "bg-red-900/50 text-red-400",
    CANCELLED: "bg-slate-700 text-slate-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
}
