import { useState, useEffect } from "react";
import { loadState, saveState, genId } from "./storage.js";
import ArtistListScreen from "./ArtistListScreen.jsx";
import ArtistDetailScreen from "./ArtistDetailScreen.jsx";

export default function App() {
  const [data, setData] = useState({ artists: [], sightings: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ screen: "list" });

  useEffect(() => {
    setData(loadState());
    setLoading(false);
  }, []);

  const persist = (next) => {
    setData(next);
    saveState(next);
  };

  const addArtist = (fields) => {
    const artist = { id: genId(), createdAt: new Date().toISOString(), ...fields };
    persist({ ...data, artists: [artist, ...data.artists] });
    return artist.id;
  };

  const updateArtist = (id, fields) => {
    persist({ ...data, artists: data.artists.map((a) => (a.id === id ? { ...a, ...fields } : a)) });
  };

  const deleteArtist = (id) => {
    persist({
      artists: data.artists.filter((a) => a.id !== id),
      sightings: data.sightings.filter((s) => s.artistId !== id),
    });
  };

  const addSighting = (artistId, fields) => {
    const sighting = { id: genId(), artistId, ...fields };
    persist({ ...data, sightings: [sighting, ...data.sightings] });
  };

  const updateSighting = (id, fields) => {
    persist({ ...data, sightings: data.sightings.map((s) => (s.id === id ? { ...s, ...fields } : s)) });
  };

  const deleteSighting = (id) => {
    persist({ ...data, sightings: data.sightings.filter((s) => s.id !== id) });
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#8A8578", fontFamily: "system-ui, sans-serif" }}>
        読み込み中...
      </div>
    );
  }

  if (view.screen === "detail") {
    const artist = data.artists.find((a) => a.id === view.artistId);
    if (artist) {
      const sightings = data.sightings.filter((s) => s.artistId === artist.id);
      return (
        <ArtistDetailScreen
          artist={artist}
          sightings={sightings}
          onBack={() => setView({ screen: "list" })}
          onUpdateArtist={(fields) => updateArtist(artist.id, fields)}
          onDeleteArtist={() => { deleteArtist(artist.id); setView({ screen: "list" }); }}
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
      artists={data.artists}
      sightings={data.sightings}
      onOpenArtist={(id) => setView({ screen: "detail", artistId: id })}
      onAddArtist={(fields) => setView({ screen: "detail", artistId: addArtist(fields) })}
    />
  );
}
