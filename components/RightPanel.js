/**
 * RightPanel — profile + details + stats about the other person
 */
export function createRightPanel({ store, profileService }) {
  let container = null;
  let otherProfile = null;
  let otherStats = null;

  function readStats() {
    try {
      return JSON.parse(localStorage.getItem("estudy_stats") || "[]");
    } catch {
      return [];
    }
  }

  function render() {
    if (!container) return;
    container.innerHTML = "";
    const state = store.getState();
    const isCollapsed = state.rightCollapsed;

    const header = document.createElement("div");
    header.className = "right-panel-section collapse-header";
    const title = document.createElement("div");
    title.className = "section-title";
    title.style.fontWeight = "600";
    title.style.fontSize = "13px";
    title.textContent = "Profile";
    const toggle = document.createElement("button");
    toggle.className = "collapse-toggle";
    toggle.setAttribute(
      "aria-label",
      isCollapsed ? "Expand details" : "Collapse details",
    );
    toggle.textContent = isCollapsed ? "‹" : "›";
    toggle.addEventListener("click", () => {
      store.setState({ rightCollapsed: !store.getState().rightCollapsed });
      render();
      document.dispatchEvent(
        new CustomEvent("rightCollapseChanged", { detail: !isCollapsed }),
      );
    });
    header.appendChild(title);
    header.appendChild(toggle);
    container.appendChild(header);

    if (!otherProfile) {
      const empty = document.createElement("div");
      empty.className = "right-panel-section";
      empty.textContent = "No conversation selected";
      empty.style.color = "var(--text-secondary)";
      empty.style.fontSize = "13px";
      container.appendChild(empty);
      return;
    }

    // Section 1: Profile
    const sec1 = document.createElement("div");
    sec1.className = "right-panel-section";
    const profDiv = document.createElement("div");
    profDiv.className = "right-profile";
    const img = document.createElement("img");
    img.src = otherProfile.profilePicUrl;
    img.alt = otherProfile.name;
    const h3 = document.createElement("h3");
    h3.textContent = otherProfile.name;
    const subj = document.createElement("p");
    if (otherProfile.role === "tutor")
      subj.textContent = otherProfile.specialty || "";
    else subj.textContent = otherProfile.subject || otherProfile.school || "";
    profDiv.appendChild(img);
    profDiv.appendChild(h3);
    profDiv.appendChild(subj);
    sec1.appendChild(profDiv);
    container.appendChild(sec1);

    // Section 2: Details
    const sec2 = document.createElement("div");
    sec2.className = "right-panel-section";
    const detTitle = document.createElement("div");
    detTitle.textContent = "Details";
    detTitle.style.fontWeight = "600";
    detTitle.style.fontSize = "13px";
    detTitle.style.marginBottom = "4px";
    sec2.appendChild(detTitle);
    const list = document.createElement("div");
    list.className = "detail-list";
    const addRow = (label, value) => {
      const row = document.createElement("div");
      row.className = "detail-row";
      const l = document.createElement("span");
      l.textContent = label;
      const v = document.createElement("span");
      v.textContent = value || "—";
      row.appendChild(l);
      row.appendChild(v);
      list.appendChild(row);
    };
    if (otherProfile.role === "student") {
      addRow("Username", otherProfile.username);
      addRow("School", otherProfile.school);
      addRow("Subject", otherProfile.subject);
      addRow("Timezone", otherProfile.timezone);
    } else {
      addRow("Username", otherProfile.username);
      addRow("Specialty", otherProfile.specialty);
      addRow("Experience", otherProfile.experience);
      addRow("Timezone", otherProfile.timezone);
    }
    sec2.appendChild(list);
    container.appendChild(sec2);

    // Section 3: Stats
    const sec3 = document.createElement("div");
    sec3.className = "right-panel-section";
    const statTitle = document.createElement("div");
    statTitle.textContent =
      otherProfile.role === "student" ? "Learning stats" : "Teaching stats";
    statTitle.style.fontWeight = "600";
    statTitle.style.fontSize = "13px";
    sec3.appendChild(statTitle);
    const grid = document.createElement("div");
    grid.className = "stat-grid";
    if (otherStats) {
      if (otherProfile.role === "student") {
        const card = document.createElement("div");
        card.className = "stat-card";
        card.innerHTML = `<div class="value">${otherStats.sessionsDone || 0}</div><div class="label">Sessions done</div>`;
        grid.appendChild(card);
      } else {
        const c1 = document.createElement("div");
        c1.className = "stat-card";
        c1.innerHTML = `<div class="value">${otherStats.sessionsTaught || 0}</div><div class="label">Sessions taught</div>`;
        const c2 = document.createElement("div");
        c2.className = "stat-card";
        c2.innerHTML = `<div class="value">${otherStats.completionRate || 0}%</div><div class="label">Completion</div>`;
        grid.appendChild(c1);
        grid.appendChild(c2);
      }
    }
    sec3.appendChild(grid);
    container.appendChild(sec3);

    container.classList.toggle("collapsed", isCollapsed);
  }

  async function updateActiveConversation(conv) {
    if (!conv) {
      otherProfile = null;
      otherStats = null;
      render();
      return;
    }
    const state = store.getState();
    const otherId =
      state.currentRole === "tutor" ? conv.studentId : conv.tutorId;
    otherProfile = await profileService.getProfile(otherId);
    const allStats = readStats();
    otherStats = allStats.find((s) => s.userId === otherId) || null;
    render();
  }

  return {
    mount(el) {
      container = el;
      container.className = "right-panel";
      store.subscribe("activeConversation:changed", (conv) =>
        updateActiveConversation(conv),
      );
      store.subscribe("profiles:changed", () => {
        const s = store.getState();
        if (s.activeConversationId) {
          // re-fetch
          const conv = { tutorId: null, studentId: null };
          // we need actual conv; better trigger via store state, but we'll just re-render if we have profile
          if (otherProfile)
            updateActiveConversation({
              tutorId: otherProfile.role === "tutor" ? otherProfile.id : null,
              studentId:
                otherProfile.role === "student" ? otherProfile.id : null,
            });
        }
      });
      render();
    },
  };
}
