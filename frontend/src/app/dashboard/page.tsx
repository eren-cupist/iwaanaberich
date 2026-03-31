"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserProfile } from "@/components/auth/UserProfile";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

interface TradingStatus {
  isActive: boolean;
  targetMarkets: string[];
  todayTradeCount: number;
  lastAnalysis: {
    market: string;
    decision: string;
    confidence: number;
    reason: string;
    createdAt: string;
  } | null;
}

interface PnlSummary {
  period: string;
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  totalTrades: number;
  winDays: number;
  lossDays: number;
  winRate: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tradingStatus, setTradingStatus] = useState<TradingStatus | null>(null);
  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const backendToken = session?.backendToken;

  useEffect(() => {
    if (backendToken) {
      axiosInstance.get("/trading/status").then((res) => setTradingStatus(res.data)).catch(() => {});
      axiosInstance.get("/profit-loss/summary?days=7").then((res) => setPnlSummary(res.data)).catch(() => {});
    }
  }, [backendToken]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-500">로딩 중...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">이와나베리치</h1>
          <UserProfile />
        </header>

        {/* 네비게이션 */}
        <nav className="flex gap-2 mb-8">
          <NavLink href="/dashboard" active>대시보드</NavLink>
          <NavLink href="/dashboard/trades">거래 이력</NavLink>
          <NavLink href="/dashboard/analysis">AI 분석</NavLink>
          <NavLink href="/dashboard/profit-loss">수익/손실</NavLink>
          <NavLink href="/dashboard/settings">설정</NavLink>
        </nav>

        {/* 트레이딩 상태 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatusCard
            title="자동매매 상태"
            value={tradingStatus?.isActive ? "활성" : "비활성"}
            color={tradingStatus?.isActive ? "text-green-400" : "text-red-400"}
          />
          <StatusCard
            title="오늘 거래"
            value={`${tradingStatus?.todayTradeCount ?? 0}건`}
          />
          <StatusCard
            title="대상 마켓"
            value={tradingStatus?.targetMarkets?.join(", ") || "미설정"}
          />
        </div>

        {/* 7일 수익 요약 */}
        {pnlSummary && (
          <div className="bg-slate-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">7일 수익 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem
                label="순수익"
                value={`${pnlSummary.netPnl >= 0 ? "+" : ""}${pnlSummary.netPnl.toLocaleString()}원`}
                color={pnlSummary.netPnl >= 0 ? "text-green-400" : "text-red-400"}
              />
              <SummaryItem label="총 거래" value={`${pnlSummary.totalTrades}건`} />
              <SummaryItem label="승률" value={`${pnlSummary.winRate.toFixed(0)}%`} />
              <SummaryItem label="수수료" value={`${pnlSummary.totalFees.toLocaleString()}원`} />
            </div>
          </div>
        )}

        {/* 최근 AI 분석 */}
        {tradingStatus?.lastAnalysis && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">최근 AI 분석</h2>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-white">{tradingStatus.lastAnalysis.market}</span>
              <span className={`font-bold ${
                tradingStatus.lastAnalysis.decision === "BUY" ? "text-green-400"
                : tradingStatus.lastAnalysis.decision === "SELL" ? "text-red-400"
                : "text-slate-400"
              }`}>
                {tradingStatus.lastAnalysis.decision}
              </span>
              <span className="text-slate-500 text-sm">
                신뢰도 {tradingStatus.lastAnalysis.confidence}%
              </span>
            </div>
            <p className="text-slate-400 text-sm">{tradingStatus.lastAnalysis.reason}</p>
          </div>
        )}
      </div>
    </main>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusCard({ title, value, color }: { title: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{title}</div>
      <div className={`text-xl font-bold ${color || "text-white"}`}>{value}</div>
    </div>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color || "text-white"}`}>{value}</div>
    </div>
  );
}
