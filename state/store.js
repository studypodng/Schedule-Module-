/**
 * Simple pub/sub store — single source of truth for UI state.
 * Listens to storage events for cross-tab sync.
 */
export function createStore(initial = {}) {
  const listeners = new Map(); // event -> Set<fn>
  const state = {
    currentUserId: initial.currentUserId || null,
    currentRole: initial.currentRole || null,
    activeConversationId: initial.activeConversationId || null,
    leftCollapsed: false,
    rightCollapsed: false,
    ...initial,
  };

  function subscribe(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event).delete(fn);
  }

  function publish(event, data) {
    const set = listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(data);
      } catch (e) {
        console.error("store publish error", e);
      }
    }
  }

  function setState(patch) {
    Object.assign(state, patch);
    publish("state:changed", { ...state });
  }

  function getState() {
    return { ...state };
  }

  // Cross-tab sync via storage event
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (!e.key) return;
      if (!e.key.startsWith("studyPod_")) return;
      // re-read fresh data is done in services; here we just broadcast
      switch (e.key) {
        case "studyPod_conversations":
          publish("conversations:external", null);
          publish("conversations:changed", null);
          break;
        case "studyPod_messages":
          publish("messages:external", null);
          publish("messages:changed", null);
          break;
        case "studyPod_offers":
          publish("offers:external", null);
          publish("offers:changed", null);
          break;
        case "studyPod_profiles":
          publish("profiles:changed", null);
          break;
        case "studyPod_stats":
          publish("stats:changed", null);
          break;
      }
    });
  }

  return { subscribe, publish, setState, getState };
}
