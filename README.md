import { useState, useEffect } from "react";

const STAGES = [
  { value: "green", label: "GREEN STAGE", color: "#1D9E75" },
  { value: "white", label: "WHITE STAGE", color: "#5F5E5A" },
  { value: "red", label: "RED MARQUEE", color: "#993C1D" },
  { value: "field", label: "FIELD OF HEAVEN", color: "#534AB7" },
  { value: "orange", label: "ORANGE CAFE", color: "#854F0B" },
  { value: "gypsy", label: "GYPSY AVALON", color: "#993556" },
];

const DAYS = [
  { value: "1", label: "DAY 1" },
  { value: "2", label: "DAY 2" },
  { value: "3", label: "DAY 3" },
  { value: "", label: "未定" },
];

const RANK_OPTIONS = [
  { value: 5, label: "殿堂入り", color: "#D9772E" },
  { value: 4, label: "また観たい", color: "#0F6E56" },
  { value: 3, label: "気になる", color: "#185FA5" },
  { value: 2, label: "チェック中", color: "#5F5E5A" },
];

const STORAGE_KEY = "fujirock:artists:v1";
const EMPTY_FORM = {
  name: "", memo: "", stage: "green", day: "1", time: "",
  spotify: "", youtube: "", rank: 3,
};

// localStorage helpers (swap these out later if moving to a backend)
function loadArtists() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load from localStorage", e);
    return [];
  }
}

function saveArtists(artists) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

export default function App() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dayFilter, setDayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setArtists(loadArtists());
    setLoading(false);
  }, []);

  const persist = (next) => {
    setArtists(next);
    saveArtists(next);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) persist(artists.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
    else persist([{ id: Date.now().toString(), ...form }, ...artists]);
    resetForm();
  };

  const handleEdit = (artist) => {
    setForm({ ...EMPTY_FORM, ...artist });
    setEditingId(artist.id);
    setShowForm(true);
  };

  const handleDelete = (id) => persist(artists.filter((a) => a.id !== id));
  const search = (q) => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

  const filtered = artists.filter((a) => dayFilter === "all" || a.day === dayFilter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === "rank" ? b.rank - a.rank : (a.time || "").localeCompare(b.time || "")
  );

  const stageInfo = (v) => STAGES.find((s) => s.value === v);
  const dayLabel = (v) => (DAYS.find((d) => d.value === v) || {}).label || "未定";

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#8A8578", fontFamily: "system-ui, sans-serif" }}>
        タイムテーブルを読み込み中...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "2rem auto", padding: "0" }}>
      {/* Header banner */}
      <div style={{
        background: "linear-gradient(180deg, #2D4A3E 0%, #1E3A2F 100%)",
        borderRadius: "16px 16px 0 0",
        padding: "1.5rem 1.5rem 1.25rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(217,119,46,0.15)",
        }} />
        <p style={{
          margin: 0, fontSize: 11, letterSpacing: "0.15em", color: "#9BC7A0",
          fontWeight: 500, textTransform: "uppercase",
        }}>
          FUJI ROCK FESTIVAL
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#F5F3EC", letterSpacing: "-0.01em" }}>
            気になるアーティストメモ
          </h2>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            style={{
              padding: "8px 16px", borderRadius: 24, border: "1px solid rgba(245,243,236,0.4)",
              background: showForm ? "rgba(245,243,236,0.15)" : "#D9772E",
              color: "#F5F3EC", cursor: "pointer", fontSize: 13, fontWeight: 500,
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {showForm ? "閉じる" : "+ 追加"}
          </button>
        </div>
      </div>

      <div style={{ background: "#F5F3EC", borderRadius: "0 0 16px 16px", padding: "1.25rem 1.5rem 1.5rem" }}>

        {/* Filters */}
        {artists.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setDayFilter("all")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: dayFilter === "all" ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                  background: "white", color: dayFilter === "all" ? "#2D4A3E" : "#6B6656",
                  fontWeight: dayFilter === "all" ? 600 : 400,
                }}>
                すべて
              </button>
              {DAYS.filter((d) => d.value).map((d) => (
                <button key={d.value} onClick={() => setDayFilter(d.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    border: dayFilter === d.value ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                    background: "white", color: dayFilter === d.value ? "#2D4A3E" : "#6B6656",
                    fontWeight: dayFilter === d.value ? 600 : 400,
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 16, background: "#D3CFC1" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setSortBy("rank")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: sortBy === "rank" ? "1px solid #6B5744" : "1px solid #D3CFC1",
                  background: sortBy === "rank" ? "#EDE6D8" : "white", color: "#6B5744",
                }}>
                評価順
              </button>
              <button onClick={() => setSortBy("time")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: sortBy === "time" ? "1px solid #6B5744" : "1px solid #D3CFC1",
                  background: sortBy === "time" ? "#EDE6D8" : "white", color: "#6B5744",
                }}>
                時間順
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div style={{
            background: "white", borderRadius: 12, padding: "1.25rem",
            marginBottom: "1.5rem", border: "1px solid #E3DFD1",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="アーティスト名" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <textarea placeholder="魅力メモ・観たい理由など" value={form.memo} rows={3}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />

              <div>
                <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>ステージ</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STAGES.map((s) => (
                    <button key={s.value} onClick={() => setForm({ ...form, stage: s.value })}
                      style={{
                        padding: "5px 10px", borderRadius: 20, fontSize: 11.5, cursor: "pointer",
                        border: form.stage === s.value ? `2px solid ${s.color}` : "1px solid #D3CFC1",
                        background: "white", color: form.stage === s.value ? s.color : "#6B6656",
                        fontWeight: form.stage === s.value ? 600 : 400,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>日程</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {DAYS.map((d) => (
                      <button key={d.value} onClick={() => setForm({ ...form, day: d.value })}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                          border: form.day === d.value ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                          background: "white", color: form.day === d.value ? "#2D4A3E" : "#6B6656",
                        }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>開始時刻</div>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
                </div>
              </div>

              <input type="text" placeholder="Spotifyリンク（任意）" value={form.spotify}
                onChange={(e) => setForm({ ...form, spotify: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="YouTubeリンク（任意）" value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <div>
                <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>評価</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {RANK_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setForm({ ...form, rank: opt.value })}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                        border: form.rank === opt.value ? `2px solid ${opt.color}` : "1px solid #D3CFC1",
                        background: "white", color: form.rank === opt.value ? opt.color : "#6B6656",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!form.name.trim()}
                style={{
                  padding: "11px", borderRadius: 8, border: "none", fontSize: 14, marginTop: 4,
                  background: form.name.trim() ? "#2D4A3E" : "#D3CFC1",
                  color: "white", cursor: form.name.trim() ? "pointer" : "not-allowed",
                  fontWeight: 500,
                }}>
                {editingId ? "更新する" : "登録する"}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#8A8578", fontSize: 14 }}>
            {artists.length === 0
              ? "まだ登録がありません。「+ 追加」から気になるアーティストを記録しましょう。"
              : "この日程のアーティストはまだ登録がありません。"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((artist) => {
              const rankInfo = RANK_OPTIONS.find((r) => r.value === artist.rank);
              const stage = stageInfo(artist.stage);
              return (
                <div key={artist.id} style={{
                  border: "1px solid #E3DFD1", borderLeft: `4px solid ${stage ? stage.color : "#B4B2A9"}`,
                  borderRadius: 10, padding: "1rem 1.1rem", background: "white",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 15.5 }}>{artist.name}</span>
                        {rankInfo && (
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 10,
                            background: rankInfo.color + "22", color: rankInfo.color, fontWeight: 500,
                          }}>
                            {rankInfo.label}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8A8578", margin: "0 0 6px" }}>
                        {stage && <span style={{ color: stage.color, fontWeight: 500 }}>{stage.label}</span>}
                        {" ・ "}{dayLabel(artist.day)}
                        {artist.time && ` ・ ${artist.time}`}
                      </p>
                      {artist.memo && (
                        <p style={{ fontSize: 13, color: "#5F5A4A", margin: "4px 0 8px", lineHeight: 1.6 }}>
                          {artist.memo}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 12, fontSize: 12, flexWrap: "wrap" }}>
                        {artist.spotify && (
                          <a href={artist.spotify} target="_blank" rel="noreferrer" style={{ color: "#0F6E56" }}>
                            Spotify ↗
                          </a>
                        )}
                        {artist.youtube && (
                          <a href={artist.youtube} target="_blank" rel="noreferrer" style={{ color: "#993C1D" }}>
                            YouTube ↗
                          </a>
                        )}
                        <button onClick={() => search(`${artist.name} 公式`)}
                          style={{ border: "none", background: "none", color: "#185FA5", cursor: "pointer", fontSize: 12, padding: 0 }}>
                          公式情報 ↗
                        </button>
                        <button onClick={() => search(`${artist.name} セットリスト フジロック`)}
                          style={{ border: "none", background: "none", color: "#534AB7", cursor: "pointer", fontSize: 12, padding: 0 }}>
                          セットリスト ↗
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleEdit(artist)}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#8A8578", padding: 4 }}>
                        編集
                      </button>
                      <button onClick={() => handleDelete(artist.id)}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#D9772E", padding: 4 }}>
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
