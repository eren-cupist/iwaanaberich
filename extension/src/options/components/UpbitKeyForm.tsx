import React, { useState } from "react";
import { useUpbitKeysStatus, useSaveUpbitKeys } from "../../hooks/queries";

export function UpbitKeyForm() {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [message, setMessage] = useState("");

  const { data: keysStatus } = useUpbitKeysStatus();
  const saveKeysMutation = useSaveUpbitKeys();

  const registered = keysStatus?.accessKey && keysStatus?.secretKey;

  const handleSave = () => {
    if (!accessKey || !secretKey) {
      setMessage("Access Key와 Secret Key를 모두 입력해주세요.");
      return;
    }

    saveKeysMutation.mutate({ accessKey, secretKey }, {
      onSuccess: () => {
        setAccessKey("");
        setSecretKey("");
        setMessage("Upbit API 키가 등록되었습니다.");
      },
      onError: (err) => {
        setMessage(`등록 실패: ${err.message}`);
      },
    });
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Upbit API 키</h2>

      <div style={styles.statusRow}>
        <span style={styles.statusLabel}>등록 상태</span>
        <span style={{
          ...styles.statusBadge,
          background: registered ? "#166534" : "#991b1b",
          color: registered ? "#4ade80" : "#fca5a5",
        }}>
          {registered ? "등록됨" : "미등록"}
        </span>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Access Key</label>
        <input
          type="password"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          placeholder="Upbit Access Key 입력"
          style={styles.input}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Secret Key</label>
        <input
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="Upbit Secret Key 입력"
          style={styles.input}
        />
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <button onClick={handleSave} disabled={saveKeysMutation.isPending} style={styles.saveBtn}>
        {saveKeysMutation.isPending ? "저장 중..." : registered ? "키 업데이트" : "키 등록"}
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
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  statusLabel: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  statusBadge: {
    fontSize: "12px",
    padding: "2px 10px",
    borderRadius: "9999px",
    fontWeight: "600",
  },
  fieldGroup: {
    marginBottom: "12px",
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
