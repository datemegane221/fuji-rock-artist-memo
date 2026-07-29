import { USERS } from "./constants.js";

export default function ProfilePickerScreen({ currentUser, onSelect, onCancel }) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "4rem auto", padding: "0 1.5rem" }}>
      <div style={{
        background: "white", border: "1px solid #E3DFD1", borderRadius: 16,
        padding: "2rem 1.75rem", textAlign: "center",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: "0.15em", color: "#8A8578", fontWeight: 500, textTransform: "uppercase" }}>
          EVENT ARTIST MEMO
        </p>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#2D4A3E" }}>
          あなたの名前を選んでください
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#8A8578" }}>
          記録した人がわかるように使います。あとから設定で変更できます。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {USERS.map((u) => (
            <button key={u.value} onClick={() => onSelect(u.value)}
              style={{
                padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                border: currentUser === u.value ? `2px solid ${u.color}` : "1px solid #D3CFC1",
                background: currentUser === u.value ? u.color + "15" : "white",
                color: currentUser === u.value ? u.color : "#2D4A3E",
              }}>
              {u.label}
            </button>
          ))}
        </div>
        {onCancel && (
          <button onClick={onCancel}
            style={{ marginTop: 16, border: "none", background: "none", color: "#8A8578", cursor: "pointer", fontSize: 13 }}>
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
}
