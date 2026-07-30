import { useState, useEffect } from "react";
import { RANK_OPTIONS, USERS } from "./constants.js";
import ThumbnailPicker from "./ThumbnailPicker.jsx";
import { resizeImageFile } from "./imageResize.js";

const EMPTY_SIGHTING_FORM = { eventName: "", date: "", stage: "", rank: 3, favoriteSong: "", memo: "", registeredBy: null, costumeMemo: "" };
const EMPTY_PROFILE_FORM = { name: "", genre: "", spotifyUrl: "", youtubeUrl: "", officialUrl: "", memo: "", thumbnailUrl: "" };

function sortByDateDesc(sightings) {
  return [...sightings].sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : NaN;
    const bt = b.date ? Date.parse(b.date) : NaN;
    const av = Number.isFinite(at) ? at : -Infinity;
    const bv = Number.isFinite(bt) ? bt : -Infinity;
    return bv - av;
  });
}

export default function ArtistDetailScreen({
  artist, sightings, currentUser, registeredByFilter, onBack, onUpdateArtist, onDeleteArtist,
  onAddSighting, onUpdateSighting, onDeleteSighting, onUploadCostumePhoto,
}) {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [showSightingForm, setShowSightingForm] = useState(false);
  const [editingSightingId, setEditingSightingId] = useState(null);
  const [sightingForm, setSightingForm] = useState(EMPTY_SIGHTING_FORM);
  const [sightingSubmitting, setSightingSubmitting] = useState(false);
  const [sightingError, setSightingError] = useState(null);

  const [existingCostumePhotoUrl, setExistingCostumePhotoUrl] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null); // { base64, mimeType, filename, previewUrl }
  const [resizing, setResizing] = useState(false);
  const [resizeError, setResizeError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadNotice, setPhotoUploadNotice] = useState(null);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState(null);

  const [deletingSightingId, setDeletingSightingId] = useState(null);
  const [sightingListError, setSightingListError] = useState(null);

  const [deletingArtist, setDeletingArtist] = useState(false);
  const [deleteArtistError, setDeleteArtistError] = useState(null);

  // release the local preview blob URL whenever it's replaced or the screen unmounts
  useEffect(() => {
    return () => {
      if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    };
  }, [pendingPhoto]);

  const sorted = sortByDateDesc(sightings);
  const latest = sorted[0] || null;
  const latestRankInfo = latest ? RANK_OPTIONS.find((r) => r.value === latest.rank) : null;

  const search = (q) => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

  const openProfileEdit = () => {
    setProfileForm({
      name: artist.name, genre: artist.genre || "", spotifyUrl: artist.spotifyUrl || "",
      youtubeUrl: artist.youtubeUrl || "", officialUrl: artist.officialUrl || "", memo: artist.memo || "",
      thumbnailUrl: artist.thumbnailUrl || "",
    });
    setProfileError(null);
    setShowProfileForm(true);
  };

  const submitProfile = async () => {
    if (!profileForm.name.trim() || profileSubmitting) return;
    setProfileSubmitting(true);
    setProfileError(null);
    try {
      await onUpdateArtist({ ...profileForm, name: profileForm.name.trim() });
      setShowProfileForm(false);
    } catch (e) {
      setProfileError(e.message || "保存に失敗しました。もう一度お試しください。");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const clearPendingPhoto = () => {
    if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    setPendingPhoto(null);
    setResizeError(null);
  };

  const openAddSighting = () => {
    // defaults to the current user but is editable, to support recording
    // something on a family member's behalf
    setSightingForm({ ...EMPTY_SIGHTING_FORM, eventName: sorted[0]?.eventName || "", registeredBy: currentUser ?? null });
    setEditingSightingId(null);
    setExistingCostumePhotoUrl(null);
    clearPendingPhoto();
    setSightingError(null);
    setShowSightingForm(true);
  };

  const openEditSighting = (s) => {
    setSightingForm({
      eventName: s.eventName || "", date: s.date || "", stage: s.stage || "",
      rank: s.rank ?? 3, favoriteSong: s.favoriteSong || "", memo: s.memo || "",
      registeredBy: s.registeredBy ?? null, costumeMemo: s.costumeMemo || "",
    });
    setEditingSightingId(s.id);
    setExistingCostumePhotoUrl(s.costumePhotoUrl || null);
    clearPendingPhoto();
    setSightingError(null);
    setShowSightingForm(true);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again later
    if (!file) return;
    setResizing(true);
    setResizeError(null);
    try {
      const { base64, mimeType, blob } = await resizeImageFile(file);
      if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
      setPendingPhoto({ base64, mimeType, filename: `costume-${Date.now()}.jpg`, previewUrl: URL.createObjectURL(blob) });
    } catch (err) {
      setResizeError(err.message || "画像の処理に失敗しました。");
    } finally {
      setResizing(false);
    }
  };

  const closeSightingForm = () => {
    setShowSightingForm(false);
    setEditingSightingId(null);
    setSightingForm(EMPTY_SIGHTING_FORM);
    setExistingCostumePhotoUrl(null);
    clearPendingPhoto();
  };

  const submitSighting = async () => {
    if (!sightingForm.eventName.trim() || sightingSubmitting || photoUploading) return;
    setSightingSubmitting(true);
    setSightingError(null);
    setPhotoUploadNotice(null);

    let pageId = editingSightingId;
    try {
      if (editingSightingId) {
        await onUpdateSighting(editingSightingId, sightingForm);
      } else {
        pageId = await onAddSighting(sightingForm);
      }
    } catch (e) {
      setSightingError(e.message || "保存に失敗しました。もう一度お試しください。");
      setSightingSubmitting(false);
      return;
    }
    setSightingSubmitting(false);

    // The sighting itself is saved at this point. A failed photo upload
    // shouldn't undo that or block closing the form - surface it separately.
    if (pendingPhoto) {
      setPhotoUploading(true);
      try {
        await onUploadCostumePhoto(pageId, {
          base64: pendingPhoto.base64, mimeType: pendingPhoto.mimeType, filename: pendingPhoto.filename,
        });
      } catch (e) {
        setPhotoUploadNotice(
          `「${sightingForm.eventName}」は保存されましたが、衣装写真のアップロードに失敗しました（${e.message || "エラー"}）。編集からもう一度お試しください。`
        );
      } finally {
        setPhotoUploading(false);
      }
    }

    closeSightingForm();
  };

  const handleDeleteSighting = async (id) => {
    setDeletingSightingId(id);
    setSightingListError(null);
    try {
      await onDeleteSighting(id);
    } catch (e) {
      setSightingListError(e.message || "削除に失敗しました。もう一度お試しください。");
    } finally {
      setDeletingSightingId(null);
    }
  };

  const handleDeleteArtist = async () => {
    if (!window.confirm(`「${artist.name}」を削除しますか？視聴履歴もすべて削除されます。`)) return;
    setDeletingArtist(true);
    setDeleteArtistError(null);
    try {
      await onDeleteArtist();
    } catch (e) {
      setDeleteArtistError(e.message || "削除に失敗しました。もう一度お試しください。");
      setDeletingArtist(false);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "2rem auto", padding: "0" }}>
      {/* Header banner */}
      <div style={{
        background: "linear-gradient(180deg, #2D4A3E 0%, #1E3A2F 100%)",
        borderRadius: "16px 16px 0 0", padding: "1.5rem 1.5rem 1.25rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(217,119,46,0.15)", pointerEvents: "none",
        }} />
        <button onClick={onBack}
          style={{
            border: "none", background: "rgba(245,243,236,0.15)", color: "#F5F3EC",
            borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", marginBottom: 10,
          }}>
          ← 一覧に戻る
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
            {artist.thumbnailUrl && (
              <img src={artist.thumbnailUrl} alt="" style={{
                width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
                border: "2px solid rgba(245,243,236,0.4)",
              }} />
            )}
            <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#F5F3EC", letterSpacing: "-0.01em" }}>
              {artist.name}
            </h2>
            {artist.genre && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9BC7A0", fontWeight: 500 }}>{artist.genre}</p>
            )}
            <div style={{ display: "flex", gap: 12, fontSize: 12, marginTop: 8, flexWrap: "wrap" }}>
              {artist.spotifyUrl && <a href={artist.spotifyUrl} target="_blank" rel="noreferrer" style={{ color: "#9BC7A0" }}>Spotify ↗</a>}
              {artist.youtubeUrl && <a href={artist.youtubeUrl} target="_blank" rel="noreferrer" style={{ color: "#9BC7A0" }}>YouTube ↗</a>}
              {artist.officialUrl && <a href={artist.officialUrl} target="_blank" rel="noreferrer" style={{ color: "#9BC7A0" }}>公式サイト ↗</a>}
              <button onClick={() => search(`${artist.name} 公式`)}
                style={{ border: "none", background: "none", color: "#9BC7A0", cursor: "pointer", fontSize: 12, padding: 0 }}>
                公式情報を検索 ↗
              </button>
            </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={openProfileEdit}
              style={{ border: "1px solid rgba(245,243,236,0.4)", background: "rgba(245,243,236,0.15)", color: "#F5F3EC", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
              編集
            </button>
            <button onClick={handleDeleteArtist} disabled={deletingArtist}
              style={{
                border: "1px solid rgba(245,243,236,0.4)", background: "rgba(245,243,236,0.15)", color: "#F5C6B8",
                borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: deletingArtist ? "default" : "pointer",
                opacity: deletingArtist ? 0.6 : 1,
              }}>
              {deletingArtist ? "削除中..." : "削除"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: "#F5F3EC", borderRadius: "0 0 16px 16px", padding: "1.25rem 1.5rem 1.5rem" }}>

        {deleteArtistError && (
          <div style={{ background: "#FBEAE3", border: "1px solid #D9772E", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#993C1D", fontSize: 13 }}>
            {deleteArtistError}
          </div>
        )}

        {/* Profile edit form */}
        {showProfileForm && (
          <div style={{ background: "white", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #E3DFD1" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="アーティスト名" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <ThumbnailPicker name={profileForm.name} thumbnailUrl={profileForm.thumbnailUrl}
                onChange={(url) => setProfileForm({ ...profileForm, thumbnailUrl: url })}
                disabled={profileSubmitting} />
              <input type="text" placeholder="ジャンル（任意）" value={profileForm.genre}
                onChange={(e) => setProfileForm({ ...profileForm, genre: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="Spotifyリンク（任意）" value={profileForm.spotifyUrl}
                onChange={(e) => setProfileForm({ ...profileForm, spotifyUrl: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="YouTubeリンク（任意）" value={profileForm.youtubeUrl}
                onChange={(e) => setProfileForm({ ...profileForm, youtubeUrl: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <input type="text" placeholder="公式サイトリンク（任意）" value={profileForm.officialUrl}
                onChange={(e) => setProfileForm({ ...profileForm, officialUrl: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <textarea placeholder="プロフィールメモ（任意）" value={profileForm.memo} rows={3}
                onChange={(e) => setProfileForm({ ...profileForm, memo: e.target.value })}
                disabled={profileSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
              {profileError && <div style={{ color: "#993C1D", fontSize: 12 }}>{profileError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitProfile} disabled={!profileForm.name.trim() || profileSubmitting}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8, border: "none", fontSize: 14,
                    background: profileForm.name.trim() ? "#2D4A3E" : "#D3CFC1",
                    color: "white", cursor: profileForm.name.trim() && !profileSubmitting ? "pointer" : "not-allowed", fontWeight: 500,
                  }}>
                  {profileSubmitting ? "保存中..." : "保存する"}
                </button>
                <button onClick={() => setShowProfileForm(false)} disabled={profileSubmitting}
                  style={{ padding: "11px 16px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, background: "white", color: "#6B6656", cursor: "pointer" }}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px", background: "white", border: "1px solid #E3DFD1", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontSize: 11, color: "#8A8578", marginBottom: 4 }}>観た回数</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2D4A3E" }}>{sightings.length}</div>
          </div>
          <div style={{ flex: "1 1 140px", background: "white", border: "1px solid #E3DFD1", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontSize: 11, color: "#8A8578", marginBottom: 4 }}>最新の評価</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: latestRankInfo ? latestRankInfo.color : "#8A8578" }}>
              {latestRankInfo ? latestRankInfo.label : "記録なし"}
            </div>
          </div>
          <div style={{ flex: "1 1 140px", background: "white", border: "1px solid #E3DFD1", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontSize: 11, color: "#8A8578", marginBottom: 4 }}>直近の推し曲</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2D4A3E" }}>
              {latest?.favoriteSong || "記録なし"}
            </div>
          </div>
        </div>

        {artist.memo && (
          <div style={{ background: "white", border: "1px solid #E3DFD1", borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 11, color: "#8A8578", marginBottom: 4 }}>プロフィールメモ</div>
            <p style={{ margin: 0, fontSize: 13, color: "#5F5A4A", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{artist.memo}</p>
          </div>
        )}

        {/* Add / edit sighting */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, color: "#2D4A3E" }}>視聴履歴</h3>
            {registeredByFilter && registeredByFilter !== "all" && (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8A8578" }}>
                「{USERS.find((u) => u.value === registeredByFilter)?.label}のみ」で絞り込み中
              </p>
            )}
          </div>
          <button onClick={() => (showSightingForm ? setShowSightingForm(false) : openAddSighting())}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid #2D4A3E", fontSize: 12, cursor: "pointer",
              background: showSightingForm ? "white" : "#2D4A3E", color: showSightingForm ? "#2D4A3E" : "white", fontWeight: 500,
            }}>
            {showSightingForm ? "閉じる" : "+ 記録を追加"}
          </button>
        </div>

        {showSightingForm && (
          <div style={{ background: "white", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #E3DFD1" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="イベント名（例: フジロックフェスティバル）" value={sightingForm.eventName}
                onChange={(e) => setSightingForm({ ...sightingForm, eventName: e.target.value })}
                disabled={sightingSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={sightingForm.date}
                  onChange={(e) => setSightingForm({ ...sightingForm, date: e.target.value })}
                  disabled={sightingSubmitting}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
                <input type="text" placeholder="ステージ（任意）" value={sightingForm.stage}
                  onChange={(e) => setSightingForm({ ...sightingForm, stage: e.target.value })}
                  disabled={sightingSubmitting}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              </div>
              <input type="text" placeholder="推し曲（任意）" value={sightingForm.favoriteSong}
                onChange={(e) => setSightingForm({ ...sightingForm, favoriteSong: e.target.value })}
                disabled={sightingSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14 }} />
              <textarea placeholder="メモ（任意）" value={sightingForm.memo} rows={3}
                onChange={(e) => setSightingForm({ ...sightingForm, memo: e.target.value })}
                disabled={sightingSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />

              <div>
                <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>衣装写真（任意）</div>
                {(pendingPhoto?.previewUrl || existingCostumePhotoUrl) && (
                  <img src={pendingPhoto?.previewUrl || existingCostumePhotoUrl} alt=""
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, marginBottom: 8, display: "block" }} />
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect}
                  disabled={sightingSubmitting || photoUploading || resizing}
                  style={{ fontSize: 13 }} />
                {resizing && <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>画像を処理中...</div>}
                {resizeError && <div style={{ color: "#993C1D", fontSize: 12, marginTop: 4 }}>{resizeError}</div>}
              </div>

              <textarea placeholder="衣装メモ（任意）" value={sightingForm.costumeMemo} rows={2}
                onChange={(e) => setSightingForm({ ...sightingForm, costumeMemo: e.target.value })}
                disabled={sightingSubmitting}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />

              <div>
                <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>評価</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {RANK_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setSightingForm({ ...sightingForm, rank: opt.value })}
                      disabled={sightingSubmitting}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                        border: sightingForm.rank === opt.value ? `2px solid ${opt.color}` : "1px solid #D3CFC1",
                        background: "white", color: sightingForm.rank === opt.value ? opt.color : "#6B6656",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6B6656", marginBottom: 6 }}>登録者</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {USERS.map((u) => (
                    <button key={u.value} onClick={() => setSightingForm({ ...sightingForm, registeredBy: u.value })}
                      disabled={sightingSubmitting}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                        border: sightingForm.registeredBy === u.value ? `2px solid ${u.color}` : "1px solid #D3CFC1",
                        background: "white", color: sightingForm.registeredBy === u.value ? u.color : "#6B6656",
                      }}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              {sightingError && <div style={{ color: "#993C1D", fontSize: 12 }}>{sightingError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitSighting} disabled={!sightingForm.eventName.trim() || sightingSubmitting || photoUploading}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8, border: "none", fontSize: 14,
                    background: sightingForm.eventName.trim() ? "#2D4A3E" : "#D3CFC1",
                    color: "white", cursor: sightingForm.eventName.trim() && !sightingSubmitting && !photoUploading ? "pointer" : "not-allowed", fontWeight: 500,
                  }}>
                  {sightingSubmitting ? "保存中..." : photoUploading ? "写真をアップロード中..." : editingSightingId ? "更新する" : "登録する"}
                </button>
                <button onClick={closeSightingForm} disabled={sightingSubmitting || photoUploading}
                  style={{ padding: "11px 16px", borderRadius: 8, border: "1px solid #D3CFC1", fontSize: 14, background: "white", color: "#6B6656", cursor: "pointer" }}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {sightingListError && (
          <div style={{ background: "#FBEAE3", border: "1px solid #D9772E", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#993C1D", fontSize: 13 }}>
            {sightingListError}
          </div>
        )}

        {photoUploadNotice && (
          <div style={{
            background: "#FBEAE3", border: "1px solid #D9772E", borderRadius: 8, padding: "0.75rem 1rem",
            marginBottom: "1rem", color: "#993C1D", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8,
          }}>
            <span>{photoUploadNotice}</span>
            <button onClick={() => setPhotoUploadNotice(null)}
              style={{ border: "none", background: "none", color: "#993C1D", cursor: "pointer", fontSize: 13, flexShrink: 0 }}>
              ×
            </button>
          </div>
        )}

        {/* Sighting history */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#8A8578", fontSize: 14 }}>
            まだ視聴記録がありません。「+ 記録を追加」から記録しましょう。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((s) => {
              const rankInfo = RANK_OPTIONS.find((r) => r.value === s.rank);
              const userInfo = USERS.find((u) => u.value === s.registeredBy);
              const isDeleting = deletingSightingId === s.id;
              return (
                <div key={s.id} style={{ border: "1px solid #E3DFD1", borderLeft: "4px solid #6B5744", borderRadius: 10, padding: "1rem 1.1rem", background: "white", opacity: isDeleting ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14.5 }}>{s.eventName}</span>
                        {rankInfo && (
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 10,
                            background: rankInfo.color + "22", color: rankInfo.color, fontWeight: 500,
                          }}>
                            {rankInfo.label}
                          </span>
                        )}
                        {userInfo && (
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 10,
                            background: userInfo.color + "22", color: userInfo.color, fontWeight: 500,
                          }}>
                            {userInfo.label}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8A8578", margin: "0 0 6px" }}>
                        {s.date || "日付未記入"}
                        {s.stage && ` ・ ${s.stage}`}
                        {s.favoriteSong && ` ・ 推し曲: ${s.favoriteSong}`}
                      </p>
                      {s.memo && <p style={{ fontSize: 13, color: "#5F5A4A", margin: "0 0 6px", lineHeight: 1.6 }}>{s.memo}</p>}
                      {s.costumePhotoUrl && (
                        <img src={s.costumePhotoUrl} alt="衣装写真" onClick={() => setEnlargedPhotoUrl(s.costumePhotoUrl)}
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, marginBottom: 6, cursor: "pointer", display: "block" }} />
                      )}
                      {s.costumeMemo && (
                        <p style={{ fontSize: 12, color: "#8A8578", margin: "0 0 6px", lineHeight: 1.6 }}>
                          衣装: {s.costumeMemo}
                        </p>
                      )}
                      <button onClick={() => search(`${artist.name} セットリスト ${s.eventName}`)}
                        style={{ border: "none", background: "none", color: "#534AB7", cursor: "pointer", fontSize: 12, padding: 0 }}>
                        セットリスト ↗
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEditSighting(s)} disabled={isDeleting}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#8A8578", padding: 4 }}>
                        編集
                      </button>
                      <button onClick={() => handleDeleteSighting(s.id)} disabled={isDeleting}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#D9772E", padding: 4 }}>
                        {isDeleting ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {enlargedPhotoUrl && (
        <div onClick={() => setEnlargedPhotoUrl(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", cursor: "pointer",
        }}>
          <img src={enlargedPhotoUrl} alt="衣装写真" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
