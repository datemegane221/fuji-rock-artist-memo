import { useState } from "react";
import { RANK_OPTIONS, USERS } from "./constants.js";
import ThumbnailPicker from "./ThumbnailPicker.jsx";
import FestivalUrlPicker from "./FestivalUrlPicker.jsx";

const EMPTY_ARTIST_FORM = {
  name: "", genre: "", spotifyUrl: "", youtubeUrl: "", officialUrl: "", memo: "", thumbnailUrl: "",
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

const normalizeName = (s) => (s || "").trim().toLowerCase();

export default function ArtistListScreen({
  artists, sightings, onOpenArtist, onOpenArtistFromFestivalUrl, onAddArtist, onOpenSettings, currentUser,
  registeredByFilter, onChangeRegisteredByFilter,
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ARTIST_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  // { festivalName, eventName, stages: [{ rawText, date, stage, ... }] }
  // from a resolved festival URL - carried into the detail screen so the
  // first sighting form can prefill / offer these as suggestions.
  const [stageSuggestions, setStageSuggestions] = useState(null);
  // Whether the currently-open form was opened via the festival URL flow -
  // tracked separately from stageSuggestions, since a resolved festival
  // page can still have no parseable stages and the sighting form should
  // auto-open regardless (this is a "add artist + sighting" flow, not
  // "add artist + maybe show some suggestions").
  const [fromFestivalUrl, setFromFestivalUrl] = useState(false);

  const sightingsByArtist = (artistId) => sightings.filter((s) => s.artistId === artistId);
  const events = Array.from(new Set(sightings.map((s) => s.eventName).filter(Boolean)));

  const canSubmit = form.name.trim().length > 0 && !submitting;

  // The URL represents a sighting, not necessarily a new artist - if an
  // artist with this name is already registered, jump straight to adding a
  // sighting for them instead of prefilling a duplicate "new artist" form.
  const handleTopFestivalApply = (data, festival) => {
    const stages = Array.isArray(data.stages) ? data.stages : [];
    const stageSuggestions = (data.eventName || stages.length > 0)
      ? { festivalName: festival?.name || "", eventName: data.eventName || "", stages }
      : null;

    const existing = artists.find((a) => normalizeName(a.name) === normalizeName(data.name));
    if (existing) {
      onOpenArtistFromFestivalUrl(existing.id, stageSuggestions);
      return;
    }

    setForm({
      name: data.name || "", genre: "", spotifyUrl: data.spotifyUrl || "",
      youtubeUrl: data.youtubeUrl || "", officialUrl: data.officialUrl || "",
      memo: data.memo || "", thumbnailUrl: data.thumbnailUrl || "",
    });
    setStageSuggestions(stageSuggestions);
    setFromFestivalUrl(true);
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAddArtist({ ...form, name: form.name.trim() }, stageSuggestions, fromFestivalUrl);
      setForm(EMPTY_ARTIST_FORM);
      setStageSuggestions(null);
      setFromFestivalUrl(false);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "登録に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  // `sightings` is already narrowed to the active registeredBy filter (done
  // in App.jsx so the same filtered set also carries into the detail
  // screen). So an artist with zero sightings here either has none at all
  // (fine under "all") or none from the selected person (hide it).
  const filteredArtists = artists.filter((a) => {
    const artistSightings = sightingsByArtist(a.id);
    if (registeredByFilter !== "all" && artistSightings.length === 0) return false;
    if (eventFilter !== "all" && !artistSightings.some((s) => s.eventName === eventFilter)) return false;
    return true;
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
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button onClick={onOpenSettings} title={currentUser ? `ログイン中: ${currentUser}` : "設定"}
              style={{
                width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(245,243,236,0.4)",
                background: "rgba(245,243,236,0.15)", color: "#F5F3EC", cursor: "pointer", fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}
            >
              ⚙
            </button>
            <button
              onClick={() => { setForm(EMPTY_ARTIST_FORM); setStageSuggestions(null); setFromFestivalUrl(false); setError(null); setShowForm(!showForm); }}
              style={{
                padding: "8px 16px", borderRadius: 24, border: "1px solid rgba(245,243,236,0.4)",
                background: showForm ? "rgba(245,243,236,0.15)" : "#D9772E",
                color: "#F5F3EC", cursor: "pointer", fontSize: 13, fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {showForm ? "閉じる" : "+ 追加"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: "#F5F3EC", borderRadius: "0 0 16px 16px", padding: "1.25rem 1.5rem 1.5rem" }}>

        {/* Festival URL entry point - represents a single sighting: an
            existing artist jumps straight to its sighting form, a new one
            opens the artist form prefilled below for confirmation first. */}
        <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.1rem", marginBottom: "1.25rem", border: "1px solid #E3DFD1" }}>
          <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 8 }}>
            フェス公式アーティストページのURLを貼って読み込む
          </div>
          <FestivalUrlPicker disabled={submitting} onApply={handleTopFestivalApply} />
        </div>

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
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => onChangeRegisteredByFilter("all")}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: registeredByFilter === "all" ? "2px solid #2D4A3E" : "1px solid #D3CFC1",
                  background: "white", color: registeredByFilter === "all" ? "#2D4A3E" : "#6B6656",
                  fontWeight: registeredByFilter === "all" ? 600 : 400,
                }}>
                すべて（ゆうき+みさき）
              </button>
              {USERS.map((u) => (
                <button key={u.value} onClick={() => onChangeRegisteredByFilter(u.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    border: registeredByFilter === u.value ? `2px solid ${u.color}` : "1px solid #D3CFC1",
                    background: "white", color: registeredByFilter === u.value ? u.color : "#6B6656",
                    fontWeight: registeredByFilter === u.value ? 600 : 400,
                  }}>
                  {u.label}のみ
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
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <ThumbnailPicker name={form.name} thumbnailUrl={form.thumbnailUrl}
                onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
                disabled={submitting} />

              <input type="text" placeholder="ジャンル（任意）" value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <input type="text" placeholder="YouTubeリンク（任意）" value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <input type="text" placeholder="Spotifyリンク（任意）" value={form.spotifyUrl}
                onChange={(e) => setForm({ ...form, spotifyUrl: e.target.value })}
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="公式サイトリンク（任意）" value={form.officialUrl}
                onChange={(e) => setForm({ ...form, officialUrl: e.target.value })}
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />

              <textarea placeholder="プロフィールメモ（任意）" value={form.memo} rows={3}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                disabled={submitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />

              {error && <div style={{ color: "#993C1D", fontSize: 12 }}>{error}</div>}

              <button onClick={handleSubmit} disabled={!canSubmit}
                style={{
                  padding: "11px", borderRadius: 8, border: "none", fontSize: 14, marginTop: 4,
                  background: canSubmit ? "#2D4A3E" : "#D3CFC1",
                  color: "white", cursor: canSubmit ? "pointer" : "not-allowed",
                  fontWeight: 500,
                }}>
                {submitting ? "登録中..." : "登録する"}
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
              const registrants = USERS.filter((u) => artistSightings.some((s) => s.registeredBy === u.value));
              return (
                <button key={artist.id} onClick={() => onOpenArtist(artist.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
                    border: "1px solid #E3DFD1", borderLeft: "4px solid #6B5744",
                    borderRadius: 10, padding: "1rem 1.1rem", background: "white", font: "inherit",
                  }}>
                  {artist.thumbnailUrl && (
                    <img src={artist.thumbnailUrl} alt="" style={{
                      width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                      {registrants.map((u) => (
                        <span key={u.value} style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 10,
                          background: u.color + "22", color: u.color, fontWeight: 500,
                        }}>
                          {u.label}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#8A8578", margin: "0 0 6px" }}>
                      {artistSightings.length > 0
                        ? `${artistSightings.length}回の記録${latest?.eventName ? ` ・ 直近: ${latest.eventName}` : ""}`
                        : "視聴記録なし"}
                    </p>
                    {artist.memo && (
                      <p style={{ fontSize: 13, color: "#5F5A4A", margin: 0, lineHeight: 1.6 }}>{artist.memo}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
