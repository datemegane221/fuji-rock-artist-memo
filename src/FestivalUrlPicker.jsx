import { useState, useEffect } from "react";
import { fetchSupportedFestivals, fetchFestivalArtistInfo } from "./api.js";

function looksLikeUrl(value) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// onApply(data, festival) is called when the URL resolves to a supported
// festival - data is { name, thumbnailUrl, memo, stageLines, spotifyUrl,
// youtubeUrl, officialUrl, sourceUrl }, festival is { id, name }.
export default function FestivalUrlPicker({ disabled, onApply }) {
  const [url, setUrl] = useState("");
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unsupported, setUnsupported] = useState(false);
  const [applied, setApplied] = useState(false);

  // Fetched once for use in the "not supported" message - not required
  // before calling festival_artist_url, since the API itself decides support.
  useEffect(() => {
    fetchSupportedFestivals().then(setFestivals).catch(() => {});
  }, []);

  const canFetch = looksLikeUrl(url) && !loading && !disabled;

  const resetStatus = () => {
    setError(null);
    setUnsupported(false);
    setApplied(false);
  };

  const handleFetch = async () => {
    if (!canFetch) return;
    setLoading(true);
    resetStatus();
    try {
      const result = await fetchFestivalArtistInfo(url.trim());
      if (result.supported) {
        onApply(result.data, result.festival);
        setApplied(true);
      } else {
        setUnsupported(true);
      }
    } catch (e) {
      setError(e.message || "情報の取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" placeholder="フェス公式アーティストページURL（任意・貼ると自動入力）" value={url}
          onChange={(e) => { setUrl(e.target.value); resetStatus(); }}
          disabled={disabled || loading}
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
        <button type="button" onClick={handleFetch} disabled={!canFetch}
          style={{
            padding: "0 14px", borderRadius: 8, fontSize: 13, whiteSpace: "nowrap",
            border: "1px solid #D3CFC1", background: canFetch ? "#EDE6D8" : "white",
            color: "#6B5744", cursor: canFetch ? "pointer" : "not-allowed",
          }}>
          {loading ? "取得中..." : "情報を取得"}
        </button>
      </div>

      {error && <div style={{ color: "#993C1D", fontSize: 12 }}>{error}</div>}

      {unsupported && (
        <div style={{ fontSize: 12, color: "#8A8578" }}>
          このURLは自動入力に対応していません
          {festivals.length > 0 && `（対応フェス: ${festivals.map((f) => f.name).join("・")}）`}
          。下の項目に手入力してください。
        </div>
      )}

      {applied && (
        <div style={{ fontSize: 12, color: "#2D4A3E" }}>
          取得した情報を下の項目に反映しました。内容を確認・修正してください。
        </div>
      )}
    </div>
  );
}
