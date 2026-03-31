import React, { useState } from "react";
import { useTradingConfig, useUpdateTradingConfig } from "../../hooks/queries";

interface Config {
  isActive: boolean;
  targetMarkets: string[];
  analysisIntervalMin: number;
  maxInvestmentKrw: number;
  maxPositionPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  riskLevel: string;
}

const DEFAULT_CONFIG: Config = {
  isActive: false,
  targetMarkets: ["KRW-BTC"],
  analysisIntervalMin: 5,
  maxInvestmentKrw: 100000,
  maxPositionPercent: 30,
  stopLossPercent: 5,
  takeProfitPercent: 10,
  riskLevel: "MEDIUM",
};

export function TradingConfigForm() {
  const { data: configData } = useTradingConfig();
  const updateConfigMutation = useUpdateTradingConfig();

  const config = configData ?? DEFAULT_CONFIG;
  const [marketsInput, setMarketsInput] = useState("");
  const [localConfig, setLocalConfig] = useState<Config | null>(null);
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  // 서버 데이터가 로드되면 로컬 state 초기화
  if (configData && !initialized) {
    setLocalConfig(configData);
    setMarketsInput(configData.targetMarkets?.join(", ") ?? "KRW-BTC");
    setInitialized(true);
  }

  const currentConfig = localConfig ?? config;

  const handleSave = () => {
    const targetMarkets = marketsInput
      .split(",")
      .map((m: string) => m.trim())
      .filter(Boolean);

    updateConfigMutation.mutate({
      ...currentConfig,
      targetMarkets,
    }, {
      onSuccess: () => setMessage("설정이 저장되었습니다."),
      onError: (err) => setMessage(`저장 실패: ${err.message}`),
    });
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>트레이딩 설정</h2>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>대상 마켓 (콤마 구분)</label>
        <input
          type="text"
          value={marketsInput}
          onChange={(e) => setMarketsInput(e.target.value)}
          placeholder="KRW-BTC, KRW-ETH"
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <div style={styles.halfField}>
          <label style={styles.label}>분석 주기 (분)</label>
          <input
            type="number"
            value={currentConfig.analysisIntervalMin}
            onChange={(e) => setLocalConfig({ ...currentConfig, analysisIntervalMin: parseInt(e.target.value) || 5 })}
            min="1"
            max="60"
            style={styles.input}
          />
        </div>
        <div style={styles.halfField}>
          <label style={styles.label}>최대 투자금 (원)</label>
          <input
            type="number"
            value={currentConfig.maxInvestmentKrw}
            onChange={(e) => setLocalConfig({ ...currentConfig, maxInvestmentKrw: parseInt(e.target.value) || 100000 })}
            min="5000"
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.halfField}>
          <label style={styles.label}>손절 비율 (%)</label>
          <input
            type="number"
            value={currentConfig.stopLossPercent}
            onChange={(e) => setLocalConfig({ ...currentConfig, stopLossPercent: parseFloat(e.target.value) || 5 })}
            min="1"
            max="50"
            step="0.5"
            style={styles.input}
          />
        </div>
        <div style={styles.halfField}>
          <label style={styles.label}>익절 비율 (%)</label>
          <input
            type="number"
            value={currentConfig.takeProfitPercent}
            onChange={(e) => setLocalConfig({ ...currentConfig, takeProfitPercent: parseFloat(e.target.value) || 10 })}
            min="1"
            max="100"
            step="0.5"
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.halfField}>
          <label style={styles.label}>최대 포지션 (%)</label>
          <input
            type="number"
            value={currentConfig.maxPositionPercent}
            onChange={(e) => setLocalConfig({ ...currentConfig, maxPositionPercent: parseInt(e.target.value) || 30 })}
            min="1"
            max="100"
            style={styles.input}
          />
        </div>
        <div style={styles.halfField}>
          <label style={styles.label}>리스크 레벨</label>
          <select
            value={currentConfig.riskLevel}
            onChange={(e) => setLocalConfig({ ...currentConfig, riskLevel: e.target.value })}
            style={styles.input}
          >
            <option value="LOW">보수적 (LOW)</option>
            <option value="MEDIUM">보통 (MEDIUM)</option>
            <option value="HIGH">공격적 (HIGH)</option>
          </select>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <button onClick={handleSave} disabled={updateConfigMutation.isPending} style={styles.saveBtn}>
        {updateConfigMutation.isPending ? "저장 중..." : "설정 저장"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "16px",
  },
  fieldGroup: {
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  halfField: {
    flex: 1,
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },
  message: {
    fontSize: "13px",
    color: "#fbbf24",
    marginBottom: "12px",
  },
  saveBtn: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
