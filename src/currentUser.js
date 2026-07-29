const STORAGE_KEY = "artist-memo:current-user";

export function loadCurrentUser() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch (e) {
    console.error("Failed to load current user from localStorage", e);
    return null;
  }
}

export function saveCurrentUser(name) {
  try {
    window.localStorage.setItem(STORAGE_KEY, name);
  } catch (e) {
    console.error("Failed to save current user to localStorage", e);
  }
}
