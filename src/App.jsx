import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api.js";
import { loadCurrentUser, saveCurrentUser } from "./currentUser.js";
import ProfilePickerScreen from "./ProfilePickerScreen.jsx";
import ArtistListScreen from "./ArtistListScreen.jsx";
import ArtistDetailScreen from "./ArtistDetailScreen.jsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());
  const [artists, setArtists] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | loaded | error
  const [loadError, setLoadError] = useState(null);
  const [view, setView] = useState({ screen: "list" });
  // "all" | a USERS value - lifted up (rather than kept in ArtistListScreen)
  // so it also narrows the sighting history shown on the detail screen.
  const [registeredByFilter, setRegisteredByFilter] = useState("all");

  const visibleSightings = registeredByFilter === "all"
    ? sightings
    : sightings.filter((s) => s.registeredBy === registeredByFilter);

  const selectCurrentUser = (name) => {
    saveCurrentUser(name);
    setCurrentUser(name);
  };

  // Guards against a stale response clobbering a newer one - e.g. StrictMode's
  // double effect invocation in dev, or a fast double-click on "再読み込み".
  const loadRequestIdRef = useRef(0);

  const loadAll = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setLoadState("loading");
    setLoadError(null);
    try {
      const [artistsData, sightingsData] = await Promise.all([api.fetchArtists(), api.fetchSightings()]);
      if (loadRequestIdRef.current !== requestId) return;
      setArtists(artistsData);
      setSightings(sightingsData);
      setLoadState("loaded");
    } catch (e) {
      if (loadRequestIdRef.current !== requestId) return;
      setLoadError(e.message || "データの読み込みに失敗しました");
      setLoadState("error");
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshArtists = async () => setArtists(await api.fetchArtists());
  const refreshSightings = async () => setSightings(await api.fetchSightings());

  const addArtist = async (fields) => {
    const result = await api.createArtist(fields);
    await refreshArtists();
    return result.id;
  };

  const updateArtist = async (id, fields) => {
    await api.updateArtist(id, fields);
    await refreshArtists();
  };

  const deleteArtist = async (id) => {
    // the API has no documented cascade behavior, so remove this artist's
    // sightings ourselves before removing the artist record itself
    const toDelete = sightings.filter((s) => s.artistId === id);
    for (const s of toDelete) {
      await api.deleteSighting(s.id);
    }
    await api.deleteArtist(id);
    await Promise.all([refreshArtists(), refreshSightings()]);
  };

  const addSighting = async (artistId, fields) => {
    // fields.registeredBy comes from the sighting form itself (defaults to
    // currentUser but is editable, to support recording on a family member's behalf)
    await api.createSighting({ ...fields, artistId });
    await refreshSightings();
  };

  const updateSighting = async (id, fields) => {
    await api.updateSighting(id, fields);
    await refreshSightings();
  };

  const deleteSighting = async (id) => {
    await api.deleteSighting(id);
    await refreshSightings();
  };

  if (!currentUser) {
    return <ProfilePickerScreen onSelect={selectCurrentUser} />;
  }

  if (view.screen === "settings") {
    return (
      <ProfilePickerScreen
        currentUser={currentUser}
        onSelect={(name) => { selectCurrentUser(name); setView({ screen: "list" }); }}
        onCancel={() => setView({ screen: "list" })}
      />
    );
  }

  if (loadState === "loading") {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#8A8578", fontFamily: "system-ui, sans-serif" }}>
        読み込み中...
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div style={{ padding: "3rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#993C1D", marginBottom: 16, fontSize: 14 }}>
          データの読み込みに失敗しました。{loadError}
        </p>
        <button onClick={loadAll}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "1px solid #2D4A3E",
            background: "white", color: "#2D4A3E", cursor: "pointer", fontSize: 14,
          }}>
          再読み込み
        </button>
      </div>
    );
  }

  if (view.screen === "detail") {
    const artist = artists.find((a) => a.id === view.artistId);
    if (artist) {
      const artistSightings = visibleSightings.filter((s) => s.artistId === artist.id);
      return (
        <ArtistDetailScreen
          artist={artist}
          sightings={artistSightings}
          currentUser={currentUser}
          registeredByFilter={registeredByFilter}
          onBack={() => setView({ screen: "list" })}
          onUpdateArtist={(fields) => updateArtist(artist.id, fields)}
          onDeleteArtist={async () => { await deleteArtist(artist.id); setView({ screen: "list" }); }}
          onAddSighting={(fields) => addSighting(artist.id, fields)}
          onUpdateSighting={updateSighting}
          onDeleteSighting={deleteSighting}
        />
      );
    }
    // artist no longer exists (e.g. deleted elsewhere) - fall through to the list
  }

  return (
    <ArtistListScreen
      artists={artists}
      sightings={visibleSightings}
      currentUser={currentUser}
      registeredByFilter={registeredByFilter}
      onChangeRegisteredByFilter={setRegisteredByFilter}
      onOpenArtist={(id) => setView({ screen: "detail", artistId: id })}
      onAddArtist={async (fields) => {
        const id = await addArtist(fields);
        setView({ screen: "detail", artistId: id });
      }}
      onOpenSettings={() => setView({ screen: "settings" })}
    />
  );
}
