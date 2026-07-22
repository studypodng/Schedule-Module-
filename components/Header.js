/**
 * Header component — shows other party profile, online status, reset button, hamburger
 */
export function createHeader({ store, profileService }) {
  let el = null;
  let otherProfile = null;
  let activeConv = null;

  function formatOffline(lastOfflineAt) {
    if (!lastOfflineAt) return "Offline";
    const diff = Date.now() - new Date(lastOfflineAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Offline · just now";
    if (mins < 60) return `Offline · ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Offline · ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `Offline · ${days}d ago`;
  }

  function renderHeader() {
    if (!el) return;
    el.innerHTML = "";
    const state = store.getState();

    const left = document.createElement("div");
    left.className = "app-header-left";

    const ham = document.createElement("button");
    ham.className = "hamburger-btn";
    ham.setAttribute("aria-label", "Open conversations menu");
    ham.innerHTML = "☰";
    ham.addEventListener("click", () =>
      store.publish("ui:toggleLeftMobile", true),
    );
    left.appendChild(ham);

    if (otherProfile) {
      const prof = document.createElement("div");
      prof.className = "header-profile";
      const img = document.createElement("img");
      img.src = otherProfile.profilePicUrl;
      img.alt = otherProfile.name;
      const meta = document.createElement("div");
      meta.className = "header-profile-meta";
      const name = document.createElement("div");
      name.className = "header-profile-name";
      name.textContent = otherProfile.name;
      const status = document.createElement("div");
      status.className = "header-status";
      const dot = document.createElement("span");
      dot.className = otherProfile.online ? "status-dot" : "status-dot offline";
      status.appendChild(dot);
      const txt = document.createElement("span");
      txt.textContent = otherProfile.online
        ? "online"
        : formatOffline(otherProfile.lastOfflineAt);
      status.appendChild(txt);
      meta.appendChild(name);
      meta.appendChild(status);
      prof.appendChild(img);
      prof.appendChild(meta);
      left.appendChild(prof);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "header-profile-name";
      placeholder.textContent = "Select a conversation";
      left.appendChild(placeholder);
    }

    const right = document.createElement("div");
    right.className = "app-header-right";

    const reset = document.createElement("button");
    reset.className = "reset-btn";
    reset.textContent = "Reset demo data";
    reset.addEventListener("click", () =>
      store.publish("ui:requestReset", true),
    );
    right.appendChild(reset);

    el.appendChild(left);
    el.appendChild(right);
  }

  async function updateActiveConversation(conv) {
    activeConv = conv;
    if (!conv) {
      otherProfile = null;
      renderHeader();
      return;
    }
    const state = store.getState();
    const otherId =
      state.currentRole === "tutor" ? conv.studentId : conv.tutorId;
    otherProfile = await profileService.getProfile(otherId);
    renderHeader();
  }

  return {
    mount(container) {
      el = container;
      el.className = "app-header";
      renderHeader();

      store.subscribe("activeConversation:changed", (conv) => {
        updateActiveConversation(conv);
      });
      store.subscribe("profiles:changed", () => {
        if (activeConv) updateActiveConversation(activeConv);
      });
      // initial
      const s = store.getState();
      if (s.activeConversationId) {
        // will be set via event later
      }
    },
    _render: renderHeader,
  };
}
