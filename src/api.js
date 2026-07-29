const BASE_URL = "https://script.google.com/macros/s/AKfycbxRkoRUn4QIemC7AUUhuOKpUEPkEmKsdY00Z6D1ktWbQx7H0olXIbgDzQqhXjzddd1L/exec";

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
