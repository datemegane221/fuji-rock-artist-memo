import { useState } from "react";
import { fetchYoutubeThumbnail } from "./api.js";

export default function ThumbnailPicker({ name, thumbnailUrl, onChange, disabled }) {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { thumbnailUrl, channelTitle, channelUrl }
  const [searched, setSearched] = useState(false);

  const canSearch = name.trim().length > 0 && !searching && !disabled;

  const handleSearch = async () => {
    if (!canSearch) return;
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchYoutubeThumbnail(name.trim());
      setResult(data);
      setSearched(true);
    } catch (e) {
      setError(e.message || "画像の検索に失敗しました。もう一度お試しください。");
    } finally {
      setSearching(false);
    }
  };

  const handleUse = () => {
    if (result?.thumbnailUrl) onChange(result.thumbnailUrl);
    setResult(null);
    setSearched(false);
  };

  const handleDismiss = () => {
    setResult(null);
    setSearched(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        )}
        <button type="button" onClick={handleSearch} disabled={!canSearch}
          style={{
            padding: "7px 14px", borderRadius: 20, fontSize: 12,
            cursor: canSearch ? "pointer" : "not-allowed",
            border: "1px solid #D3CFC1", background: "white", color: "#6B5744",
          }}>
          {searching ? "検索中..." : thumbnailUrl ? "画像を検索し直す" : "画像を検索"}
        </button>
      </div>

      {error && <div style={{ color: "#993C1D", fontSize: 12, marginTop: 6 }}>{error}</div>}

      {searched && !result && !error && (
        <div style={{ fontSize: 12, color: "#8A8578", marginTop: 6 }}>画像が見つかりませんでした。</div>
      )}

      {result && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginTop: 8,
          padding: "0.6rem 0.75rem", border: "1px solid #E3DFD1", borderRadius: 8, background: "#F5F3EC",
        }}>
          <img src={result.thumbnailUrl} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#5F5A4A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {result.channelTitle}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button type="button" onClick={handleUse}
                style={{ padding: "5px 12px", borderRadius: 14, fontSize: 11, border: "none", background: "#2D4A3E", color: "white", cursor: "pointer" }}>
                この画像を使う
              </button>
              <button type="button" onClick={handleDismiss}
                style={{ padding: "5px 12px", borderRadius: 14, fontSize: 11, border: "1px solid #D3CFC1", background: "white", color: "#6B6656", cursor: "pointer" }}>
                使わない
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
