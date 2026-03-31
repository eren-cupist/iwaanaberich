"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

interface Analysis {
  id: string;
  market: string;
  decision: string;
  confidence: number;
  reason: string;
  technicalSummary: Record<string, unknown> | null;
  gptModel: string;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string;
}

export default function AnalysisPage() {
  const { data: session } = useSession();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const backendToken = session?.backendToken;

  useEffect(() => {
    if (backendToken) {
      axiosInstance.get("/trading/history?limit=20")
        .then((res) => {
          const analysisData = res.data
            .filter((t: any) => t.aiAnalysis)
            .map((t: any) => t.aiAnalysis);
          setAnalyses(analysisData);
        })
        .catch(() => {});
    }
  }, [backendToken]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr;</Link>
          <h1 className="text-2xl font-bold text-white">AI 분석 결과</h1>
        </div>

        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="bg-slate-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white font-bold">{analysis.market}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    analysis.decision === "BUY" ? "bg-green-900/50 text-green-400"
                    : analysis.decision === "SELL" ? "bg-red-900/50 text-red-400"
                    : "bg-slate-700 text-slate-400"
                  }`}>
                    {analysis.decision}
                  </span>
                  <span className="text-slate-500 text-sm">
                    신뢰도 {analysis.confidence}%
                  </span>
                </div>
                <span className="text-slate-500 text-sm">
                  {new Date(analysis.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>

              <p className="text-slate-300 text-sm mb-3">{analysis.reason}</p>

              {analysis.technicalSummary && (
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs font-mono text-slate-400">
                  {Object.entries(analysis.technicalSummary).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-slate-500">{key}:</span>
                      <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>모델: {analysis.gptModel}</span>
                {analysis.promptTokens && (
                  <span>토큰: {analysis.promptTokens} + {analysis.completionTokens}</span>
                )}
              </div>
            </div>
          ))}

          {analyses.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              AI 분석 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
