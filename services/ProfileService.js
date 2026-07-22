// ProfileService — read-only profiles
const KEY = "studyPod_profiles";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export const ProfileService = {
  getProfile(userId) {
    return Promise.resolve(read().find((p) => p.id === userId) || null);
  },
  listProfiles() {
    return Promise.resolve(read());
  },
  // internal sync helper
  _read() {
    return read();
  },
};
