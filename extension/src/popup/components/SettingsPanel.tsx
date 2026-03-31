import React, { useState } from "react";
import {
  useUpbitKeysStatus,
  useTradingConfig,
  useSaveUpbitKeys,
  useUpdateTradingConfig,
} from "../../hooks/queries";

export function SettingsPanel() {
  const { data: keysStatus } = useUpbitKeysStatus();
  const { data: configData } = useTradingConfig();
  const saveKeysMutation = useSaveUpbitKeys();
  const updateConfigMutation = useUpdateTradingConfig();

  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [editingAccess, setEditingAccess] = useState(false);
  const [editingSecret, setEditingSecret] = useState(false);
  const [markets, setMarkets] = useState("");
  const [interval, setInterval] = useState(1);
  const [maxInvest, setMaxInvest] = useState(100000);
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(10);
  const [msg, setMsg] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);

  // 설정 데이터가 로드되면 로컬 state에 반영
  if (configData && !configLoaded) {
    setMarkets(configData.targetMarkets?.join(", ") || "KRW-BTC");
    setInterval(configData.analysisIntervalMin || 1);
    setMaxInvest(Number(configData.maxInvestmentKrw) || 100000);
    setRiskLevel(configData.riskLevel || "MEDIUM");
    setStopLoss(Number(configData.stopLossPercent) || 5);
    setTakeProfit(Number(configData.takeProfitPercent) || 10);
    setConfigLoaded(true);
  }

  const accessKeySaved = keysStatus?.accessKey ?? false;
  const secretKeySaved = keysStatus?.secretKey ?? false;
  const saving = saveKeysMutation.isPending || updateConfigMutation.isPending;

  const handleSaveAccess = () => {
    if (!accessKey) { setMsg("Access Key를 입력해주세요."); return; }
    saveKeysMutation.mutate({ accessKey }, {
      onSuccess: () => {
        setEditingAccess(false);
        setAccessKey("");
        setMsg("Access Key 저장 완료");
      },
      onError: () => setMsg("Access Key 저장 실패"),
    });
  };

  const handleSaveSecret = () => {
    if (!secretKey) { setMsg("Secret Key를 입력해주세요."); return; }
    saveKeysMutation.mutate({ secretKey }, {
      onSuccess: () => {
        setEditingSecret(false);
        setSecretKey("");
        setMsg("Secret Key 저장 완료");
      },
      onError: () => setMsg("Secret Key 저장 실패"),
    });
  };

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      targetMarkets: markets.split(",").map((m) => m.trim()).filter(Boolean),
      analysisIntervalMin: interval,
      maxInvestmentKrw: maxInvest,
      riskLevel,
      stopLossPercent: stopLoss,
      takeProfitPercent: takeProfit,
    }, {
      onSuccess: () => setMsg("설정 저장 완료"),
      onError: () => setMsg("설정 저장 실패"),
    });
  };

  return (
    <div style={styles.wrap}>
      {msg && <div style={styles.msg}>{msg}</div>}

      {/* Upbit 키 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Upbit API 키</div>

        <KeyField
          label="Access Key"
          saved={accessKeySaved}
          editing={editingAccess}
          value={accessKey}
          onChange={setAccessKey}
          onEdit={() => setEditingAccess(true)}
          onSave={handleSaveAccess}
          saving={saving}
        />

        <KeyField
          label="Secret Key"
          saved={secretKeySaved}
          editing={editingSecret}
          value={secretKey}
          onChange={setSecretKey}
          onEdit={() => setEditingSecret(true)}
          onSave={handleSaveSecret}
          saving={saving}
        />
      </div>

      {/* 트레이딩 설정 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>트레이딩 설정</div>
        <label style={styles.label}>대상 마켓</label>
        <input type="text" value={markets} onChange={(e) => setMarkets(e.target.value)}
          placeholder="KRW-BTC, KRW-ETH" style={styles.input} />

        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>분석 주기(분)</label>
            <input type="number" value={interval} onChange={(e) => setInterval(+e.target.value || 1)}
              min="1" max="60" style={styles.input} />
          </div>
          <div style={styles.half}>
            <label style={styles.label}>최대 투자금(원)</label>
            <input type="number" value={maxInvest} onChange={(e) => setMaxInvest(+e.target.value || 100000)}
              min="5000" style={styles.input} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>손절(%)</label>
            <input type="number" value={stopLoss} onChange={(e) => setStopLoss(+e.target.value || 5)}
              min="1" max="50" step="0.5" style={styles.input} />
          </div>
          <div style={styles.half}>
            <label style={styles.label}>익절(%)</label>
            <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(+e.target.value || 10)}
              min="1" max="100" step="0.5" style={styles.input} />
          </div>
        </div>

        <label style={styles.label}>리스크</label>
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={styles.input}>
          <option value="LOW">보수적</option>
          <option value="MEDIUM">보통</option>
          <option value="HIGH">공격적</option>
        </select>

        <button onClick={handleSaveConfig} disabled={saving}
          style={{ ...styles.btn, background: "#16a34a" }}>
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </div>
    </div>
  );
}

function KeyField({
  label, saved, editing, value, onChange, onEdit, onSave, saving,
}: {
  label: string;
  saved: boolean;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (saved && !editing) {
    return (
      <div style={styles.keyRow}>
        <span style={styles.keyLabel}>{label}</span>
        <span style={styles.keyRegistered}>등록됨</span>
        <button onClick={onEdit} style={styles.updateBtn}>업데이트</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "4px" }}>
      <label style={styles.label}>{label}</label>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={`${label}를 입력하세요`} style={styles.input} />
      <button onClick={onSave} disabled={saving} style={styles.btn}>
        {saving ? "저장 중..." : `${label} 저장`}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "10px" },
  section: {
    background: "#1e293b", borderRadius: "8px", padding: "12px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  sectionTitle: { fontSize: "13px", fontWeight: "600", color: "#f1f5f9" },
  label: { fontSize: "11px", color: "#64748b", marginTop: "4px" },
  input: {
    width: "100%", padding: "6px 10px", background: "#0f172a", color: "#e2e8f0",
    border: "1px solid #334155", borderRadius: "5px", fontSize: "12px", outline: "none",
    boxSizing: "border-box" as const,
  },
  row: { display: "flex", gap: "8px" },
  half: { flex: 1 },
  btn: {
    marginTop: "6px", padding: "8px", background: "#3b82f6", color: "white",
    border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
  },
  msg: {
    padding: "6px 10px", background: "#fbbf2420", borderRadius: "6px",
    fontSize: "11px", color: "#fbbf24",
  },
  keyRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "6px 0",
  },
  keyLabel: { fontSize: "12px", color: "#94a3b8", flex: 1 },
  keyRegistered: { fontSize: "11px", color: "#4ade80", fontWeight: "600" },
  updateBtn: {
    padding: "4px 10px", background: "#334155", color: "#94a3b8",
    border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer",
  },
};
