const STORAGE_KEY = "artist-memo:v3";
const LEGACY_V2_KEY = "artist-memo:artists:v2";
const LEGACY_V1_KEY = "fujirock:artists:v1";

const LEGACY_EVENT_NAME = "FUJI ROCK FESTIVAL";
const LEGACY_STAGE_LABELS = {
  green: "GREEN STAGE",
  white: "WHITE STAGE",
  red: "RED MARQUEE",
  field: "FIELD OF HEAVEN",
  orange: "ORANGE CAFE",
  gypsy: "GYPSY AVALON",
};
const LEGACY_DAY_LABELS = { 1: "DAY 1", 2: "DAY 2", 3: "DAY 3" };

export function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeDateFromLegacyId(id) {
  const n = Number(id);
  if (Number.isFinite(n) && n > 0) return new Date(n).toISOString();
  return new Date().toISOString();
}

// v1 (fujirock:artists:v1) was Fuji Rock-only: fixed stage slugs, DAY 1-3, a
// start time. Reuse the same label mapping as the earlier v1->v2 migration
// so v1 data can flow through the v2->v3 step below without duplicating logic.
function migrateV1EntryToV2Shape(a) {
  return {
    id: a.id,
    name: a.name,
    memo: a.memo || "",
    event: LEGACY_EVENT_NAME,
    stage: LEGACY_STAGE_LABELS[a.stage] || a.stage || "",
    day: LEGACY_DAY_LABELS[a.day] || "",
    spotify: a.spotify || "",
    youtube: a.youtube || "",
    rank: a.rank ?? 3,
  };
}

// v2 (artist-memo:artists:v2) had one flat record per artist+event. v3 splits
// that into an artist profile plus one sighting per record. Records sharing
// the same (trimmed, case-insensitive) name are merged into a single artist
// with multiple sightings.
function migrateV2ToV3(v2Entries) {
  const artists = [];
  const sightings = [];
  const byName = new Map();

  for (const old of v2Entries) {
    const key = (old.name || "").trim().toLowerCase();
    let artist = byName.get(key);
    if (!artist) {
      artist = {
        id: genId(),
        name: old.name || "",
        spotifyUrl: old.spotify || "",
        youtubeUrl: old.youtube || "",
        officialUrl: "",
        genre: "",
        memo: "",
        createdAt: safeDateFromLegacyId(old.id),
      };
      byName.set(key, artist);
      artists.push(artist);
    } else {
      if (!artist.spotifyUrl && old.spotify) artist.spotifyUrl = old.spotify;
      if (!artist.youtubeUrl && old.youtube) artist.youtubeUrl = old.youtube;
    }

    // v3 sightings have no dedicated "day" field, so fold the old freeform
    // day text into the memo rather than dropping it.
    const dayNote = old.day ? `(${old.day})` : "";
    sightings.push({
      id: genId(),
      artistId: artist.id,
      eventName: old.event || "",
      date: "",
      stage: old.stage || "",
      rank: old.rank ?? 3,
      favoriteSong: "",
      memo: [old.memo, dayNote].filter(Boolean).join(" "),
    });
  }

  return { artists, sightings };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    let v2Entries = null;
    const v2Raw = window.localStorage.getItem(LEGACY_V2_KEY);
    if (v2Raw) {
      v2Entries = JSON.parse(v2Raw);
    } else {
      const v1Raw = window.localStorage.getItem(LEGACY_V1_KEY);
      if (v1Raw) v2Entries = JSON.parse(v1Raw).map(migrateV1EntryToV2Shape);
    }

    if (v2Entries && v2Entries.length) {
      const migrated = migrateV2ToV3(v2Entries);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return { artists: [], sightings: [] };
  } catch (e) {
    console.error("Failed to load from localStorage", e);
    return { artists: [], sightings: [] };
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}
