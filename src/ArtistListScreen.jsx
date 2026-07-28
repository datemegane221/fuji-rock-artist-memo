import { useState } from "react";
import { RANK_OPTIONS } from "./constants.js";
import { fetchYoutubeTitle } from "./youtubeOEmbed.js";

const EMPTY_ARTIST_FORM = {
  name: "", genre: "", spotifyUrl: "", youtubeUrl: "", officialUrl: "", memo: "",
};

function latestSighting(sightings) {
  if (sightings.length === 0) return null;
  return [...sightings].sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : NaN;
    const bt = b.date ? Date.parse(b.date) : NaN;
    const av = Number.isFinite(at) ? at : -Infinity;
    const bv = Number.isFinite(bt) ? bt : -Infinity;
    return bv - av;
  })[0];
}

export default function ArtistListScreen({ artists, sightings, onOpenArtist, onAddArtist }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ARTIST_FORM);
  const [suggesting, setSuggesting] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");

  const sightingsByArtist = (artistId) => sightings.filter((s) => s.artistId === artistId);
  const events = Array.from(new Set(sightings.map((s) => s.eventName).filter(Boolean)));

  const handleYoutubeBlur = async () => {
    const url = form.youtubeUrl.trim();
    if (!url || form.name.trim()) return;
    setSuggesting(true);
    const title = await fetchYoutubeTitle(url);
    setSuggesting(false);
    if (title) setForm((f) => (f.name.trim() ? f : { ...f, name: title }));
  };

  const canSubmit = form.name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAddArtist({ ...form, name: form.name.trim() });
    setForm(EMPTY_ARTIST_FORM);
    setShowForm(false);
  };

  const filteredArtists = artists.filter((a) => {
    if (eventFilter === "all") return true;
    return sightingsByArtist(a.id).some((s) => s.eventName === eventFilter);
  });

  const sorted = [...filteredArtists].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "ja");
    const ar = latestSighting(sightingsByArtist(a.id))?.rank ?? -1;
    const br = latestSighting(sightingsByArtist(b.id))?.rank ?? -1;
    return br - ar;
  });

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
          borderRadius: "50%", background: "rgba(217,119,46,0.15)", pointerEvents: "none",
        }} />
        <p style={{
          margin: 0, fontSize: 11, letterSpacing: "0.15em", color: "#9BC7A0",
          fontWeight: 500, textTransform: "uppercase",
        }}>
          EVENT ARTIST MEMO
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#F5F3EC", letterSpacing: "-0.01em" }}>
            気になるアーティストメモ
          </h2>
          <button
            onClick={() => { setForm(EMPTY_ARTIST_FORM); setShowForm(!showForm); }}
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
              <button onClick={() => setEventFilter("all")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: eventFilter === "all" ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                  background: "white", color: eventFilter === "all" ? "#2D4A3E" : "#6B6656",
                  fontWeight: eventFilter === "all" ? 600 : 400,
                }}>
                すべて
              </button>
              {events.map((ev) => (
                <button key={ev} onClick={() => setEventFilter(ev)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    border: eventFilter === ev ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                    background: "white", color: eventFilter === ev ? "#2D4A3E" : "#6B6656",
                    fontWeight: eventFilter === ev ? 600 : 400,
                  }}>
                  {ev}
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
              <button onClick={() => setSortBy("name")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: sortBy === "name" ? "1px solid #6B5744" : "1px solid #D3CFC1",
                  background: sortBy === "name" ? "#EDE6D8" : "white", color: "#6B5744",
                }}>
                名前順
              </button>
            </div>
          </div>
        )}

        {/* Add artist form */}
        {showForm && (
          <div style={{
            background: "white", borderRadius: 12, padding: "1.25rem",
            marginBottom: "1.5rem", border: "1px solid #E3DFD1",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="アーティスト名" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <input type="text" placeholder="ジャンル（任意）" value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <div>
                <input type="text" placeholder="YouTubeリンク（任意）" value={form.youtubeUrl}
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                  onBlur={handleYoutubeBlur}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, boxSizing: "border-box" }} />
                {suggesting && (
                  <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>
                    動画タイトルからアーティスト名を取得中...
                  </div>
                )}
              </div>

              <input type="text" placeholder="Spotifyリンク（任意）" value={form.spotifyUrl}
                onChange={(e) => setForm({ ...form, spotifyUrl: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="公式サイトリンク（任意）" value={form.officialUrl}
                onChange={(e) => setForm({ ...form, officialUrl: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <textarea placeholder="プロフィールメモ（任意）" value={form.memo} rows={3}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />

              <button onClick={handleSubmit} disabled={!canSubmit}
                style={{
                  padding: "11px", borderRadius: 8, border: "none", fontSize: 14, marginTop: 4,
                  background: canSubmit ? "#2D4A3E" : "#D3CFC1",
                  color: "white", cursor: canSubmit ? "pointer" : "not-allowed",
                  fontWeight: 500,
                }}>
                登録する
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#8A8578", fontSize: 14 }}>
            {artists.length === 0
              ? "まだ登録がありません。「+ 追加」から気になるアーティストを記録しましょう。"
              : "該当するアーティストはまだ登録がありません。"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((artist) => {
              const artistSightings = sightingsByArtist(artist.id);
              const latest = latestSighting(artistSightings);
              const rankInfo = latest ? RANK_OPTIONS.find((r) => r.value === latest.rank) : null;
              return (
                <button key={artist.id} onClick={() => onOpenArtist(artist.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                    border: "1px solid #E3DFD1", borderLeft: "4px solid #6B5744",
                    borderRadius: 10, padding: "1rem 1.1rem", background: "white", font: "inherit",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 15.5, color: "#222" }}>{artist.name}</span>
                    {artist.genre && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#EDE6D8", color: "#6B5744" }}>
                        {artist.genre}
                      </span>
                    )}
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
                    {artistSightings.length > 0
                      ? `${artistSightings.length}回の記録${latest?.eventName ? ` ・ 直近: ${latest.eventName}` : ""}`
                      : "視聴記録なし"}
                  </p>
                  {artist.memo && (
                    <p style={{ fontSize: 13, color: "#5F5A4A", margin: 0, lineHeight: 1.6 }}>{artist.memo}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
