"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [keysRegistered, setKeysRegistered] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [config, setConfig] = useState({
    targetMarkets: "KRW-BTC",
    analysisIntervalMin: 5,
    maxInvestmentKrw: 100000,
    maxPositionPercent: 30,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    riskLevel: "MEDIUM",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const backendToken = session?.backendToken;

  useEffect(() => {
    if (backendToken) {
      axiosInstance.get("/upbit/keys/status")
        .then((res) => setKeysRegistered(res.data.registered))
        .catch(() => {});

      axiosInstance.get("/trading-config")
        .then((res) => {
          if (res.data) {
            setConfig({
              targetMarkets: res.data.targetMarkets?.join(", ") || "KRW-BTC",
              analysisIntervalMin: res.data.analysisIntervalMin || 5,
              maxInvestmentKrw: Number(res.data.maxInvestmentKrw) || 100000,
              maxPositionPercent: res.data.maxPositionPercent || 30,
              stopLossPercent: Number(res.data.stopLossPercent) || 5,
              takeProfitPercent: Number(res.data.takeProfitPercent) || 10,
              riskLevel: res.data.riskLevel || "MEDIUM",
            });
          }
        })
        .catch(() => {});
    }
  }, [backendToken]);

  const handleSaveKey = async (type: "access" | "secret") => {
    const key = type === "access" ? accessKey : secretKey;
    if (!key) { setMessage(`${type === "access" ? "Access" : "Secret"} Key를 입력해주세요.`); return; }
    setSaving(true);
    try {
      const body = type === "access" ? { accessKey } : { secretKey };
      await axiosInstance.put("/upbit/keys", body);
      if (type === "access") setAccessKey(""); else setSecretKey("");
      setMessage(`${type === "access" ? "Access" : "Secret"} Key 저장 완료`);
      axiosInstance.get("/upbit/keys/status").then((res) => setKeysRegistered(res.data.registered)).catch(() => {});
    } catch {
      setMessage("키 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const targetMarkets = config.targetMarkets.split(",").map((m) => m.trim()).filter(Boolean);
      await axiosInstance.put("/trading-config", {
        ...config,
        targetMarkets,
      });
      setMessage("설정이 저장되었습니다.");
    } catch {
      setMessage("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr;</Link>
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>

        {message && (
          <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-300 px-4 py-3 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Upbit API 키 */}
        <section className="bg-slate-900 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Upbit API 키</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-400">등록 상태:</span>
            <span className={`text-sm font-medium ${keysRegistered ? "text-green-400" : "text-red-400"}`}>
              {keysRegistered ? "등록됨" : "미등록"}
            </span>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Access Key"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSaveKey("access")}
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Access Key 저장
            </button>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Secret Key"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSaveKey("secret")}
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Secret Key 저장
            </button>
          </div>
        </section>

        {/* 트레이딩 설정 */}
        <section className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">트레이딩 설정</h2>
          <div className="space-y-4">
            <Field label="대상 마켓 (콤마 구분)">
              <input
                type="text"
                value={config.targetMarkets}
                onChange={(e) => setConfig({ ...config, targetMarkets: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="분석 주기 (분)">
                <input
                  type="number"
                  value={config.analysisIntervalMin}
                  onChange={(e) => setConfig({ ...config, analysisIntervalMin: parseInt(e.target.value) || 5 })}
                  min="1" max="60"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </Field>
              <Field label="최대 투자금 (원)">
                <input
                  type="number"
                  value={config.maxInvestmentKrw}
                  onChange={(e) => setConfig({ ...config, maxInvestmentKrw: parseInt(e.target.value) || 100000 })}
                  min="5000"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="손절 (%)">
                <input
                  type="number"
                  value={config.stopLossPercent}
                  onChange={(e) => setConfig({ ...config, stopLossPercent: parseFloat(e.target.value) || 5 })}
                  min="1" max="50" step="0.5"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </Field>
              <Field label="익절 (%)">
                <input
                  type="number"
                  value={config.takeProfitPercent}
                  onChange={(e) => setConfig({ ...config, takeProfitPercent: parseFloat(e.target.value) || 10 })}
                  min="1" max="100" step="0.5"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </Field>
              <Field label="리스크 레벨">
                <select
                  value={config.riskLevel}
                  onChange={(e) => setConfig({ ...config, riskLevel: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">보수적</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">공격적</option>
                </select>
              </Field>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
