const BASE_URL = "https://script.google.com/macros/s/AKfycbyZJVqULyfsH6Xh4Qy2v3DQH3uUE0KMlBBjgOW0B6R1Q1fKMeDJRVJgpFNNBRS-Dw2p/exec";

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`通信エラーが発生しました (HTTP ${res.status})`);
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "APIエラーが発生しました");
  return body.data;
}

// text/plain avoids a CORS preflight (application/json triggers one, which
// GAS Web Apps don't handle); the script parses e.postData.contents as JSON.
async function postJson(payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`通信エラーが発生しました (HTTP ${res.status})`);
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "APIエラーが発生しました");
  return body.result;
}

export function fetchArtists() {
  return getJson(`${BASE_URL}?resource=artists`);
}

export async function fetchSightings() {
  const data = await getJson(`${BASE_URL}?resource=sightings`);
  // Notion Select properties always come back as strings (e.g. "5"), but the
  // app treats rank as a number (RANK_OPTIONS values) everywhere it compares
  // or sorts - normalize here so nothing downstream has to think about it.
  return data.map((s) => ({ ...s, rank: s.rank ? Number(s.rank) : s.rank }));
}

export function createArtist(data) {
  return postJson({ resource: "artist", action: "create", data });
}

export function updateArtist(id, data) {
  return postJson({ resource: "artist", action: "update", id, data });
}

export function deleteArtist(id) {
  return postJson({ resource: "artist", action: "delete", id });
}

export function createSighting(data) {
  return postJson({ resource: "sighting", action: "create", data });
}

export function updateSighting(id, data) {
  return postJson({ resource: "sighting", action: "update", id, data });
}

export function deleteSighting(id) {
  return postJson({ resource: "sighting", action: "delete", id });
}

// data is { channelId, channelTitle, channelUrl, thumbnailUrl } or null (not found)
export function fetchYoutubeThumbnail(name) {
  return getJson(`${BASE_URL}?resource=youtube_thumbnail&name=${encodeURIComponent(name)}`);
}

// data is { base64, filename, mimeType }. No "action" field means "upload"
// (kept as-is for backward compatibility with the already-deployed GAS code).
export function uploadCostumePhoto(pageId, data) {
  return postJson({ resource: "costume_photo", pageId, data });
}

export function deleteCostumePhoto(pageId) {
  return postJson({ resource: "costume_photo", action: "delete", pageId });
}

// data is [{ id, name }, ...]
export function fetchSupportedFestivals() {
  return getJson(`${BASE_URL}?resource=supported_festivals`);
}

// result is { supported, festival, data } - see FestivalUrlPicker for the shape of `data`
export function fetchFestivalArtistInfo(url) {
  return postJson({ resource: "festival_artist_url", data: { url } });
}
