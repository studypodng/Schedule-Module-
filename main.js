import { createStore } from "./state/store.js";
import { ProfileService } from "./services/ProfileService.js";
import { ConversationService } from "./services/ConversationService.js";
import { ChatService } from "./services/ChatService.js";
import { OfferService } from "./services/OfferService.js";
import { createHeader } from "./components/Header.js";
import { createLeftNav } from "./components/LeftNav.js";
import { createRightPanel } from "./components/RightPanel.js";
import { createChatWindow } from "./components/ChatWindow.js";
import { createOfferForm } from "./components/OfferForm.js";

// Demo constants — must match seeded data
export const DEMO_TUTOR_ID = "tutor-1";
export const DEMO_STUDENT_ID = "student-1";

const STORAGE_KEYS = [
  "studyPod_profiles",
  "studyPod_stats",
  "studyPod_conversations",
  "studyPod_messages",
  "studyPod_offers",
];

function seedDemoData() {
  // Profiles
  const profiles = [
    {
      id: "tutor-1",
      role: "tutor",
      name: "Dr. Sarah Chen",
      profilePicUrl: "https://i.pravatar.cc/150?img=32",
      online: true,
      lastOfflineAt: null,
      username: "sarahchen",
      timezone: "GMT+1 (WAT)",
      specialty: "Mathematics & Physics",
      experience: "8 years",
    },
    {
      id: "student-1",
      role: "student",
      name: "Alex Morgan",
      profilePicUrl: "https://i.pravatar.cc/150?img=8",
      online: false,
      lastOfflineAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      username: "alexm",
      timezone: "GMT+1 (WAT)",
      school: "Federal Univ.",
      subject: "Calculus",
    },
    {
      id: "student-2",
      role: "student",
      name: "Jamie Lee",
      profilePicUrl: "https://i.pravatar.cc/150?img=5",
      online: true,
      lastOfflineAt: null,
      username: "jamielee",
      timezone: "GMT+0",
      school: "Unilag",
      subject: "Physics",
    },
    {
      id: "student-3",
      role: "student",
      name: "Priya Patel",
      profilePicUrl: "https://i.pravatar.cc/150?img=23",
      online: false,
      lastOfflineAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      username: "priyap",
      timezone: "GMT+5:30",
      school: "IIT Bombay",
      subject: "Algebra",
    },
    {
      id: "tutor-2",
      role: "tutor",
      name: "Prof. David Kim",
      profilePicUrl: "https://i.pravatar.cc/150?img=12",
      online: true,
      lastOfflineAt: null,
      username: "davidkim",
      timezone: "GMT-5 (EST)",
      specialty: "Computer Science",
      experience: "12 years",
    },
    {
      id: "tutor-3",
      role: "tutor",
      name: "Emma Wilson",
      profilePicUrl: "https://i.pravatar.cc/150?img=26",
      online: false,
      lastOfflineAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      username: "emmaw",
      timezone: "GMT+1 (CET)",
      specialty: "English Literature",
      experience: "6 years",
    },
  ];

  const stats = [
    { userId: "tutor-1", sessionsTaught: 342, completionRate: 96 },
    { userId: "tutor-2", sessionsTaught: 210, completionRate: 89 },
    { userId: "tutor-3", sessionsTaught: 128, completionRate: 92 },
    { userId: "student-1", sessionsDone: 18 },
    { userId: "student-2", sessionsDone: 7 },
    { userId: "student-3", sessionsDone: 23 },
  ];

  const now = Date.now();
  const conversations = [
    {
      id: "conv-1",
      tutorId: "tutor-1",
      studentId: "student-1",
      lastMessageAt: new Date(now - 1000 * 60 * 5).toISOString(),
      unreadCountForTutor: 1,
      unreadCountForStudent: 0,
    },
    {
      id: "conv-2",
      tutorId: "tutor-1",
      studentId: "student-2",
      lastMessageAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      unreadCountForTutor: 0,
      unreadCountForStudent: 2,
    },
    {
      id: "conv-3",
      tutorId: "tutor-1",
      studentId: "student-3",
      lastMessageAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      unreadCountForTutor: 0,
      unreadCountForStudent: 0,
    },
    {
      id: "conv-4",
      tutorId: "tutor-2",
      studentId: "student-1",
      lastMessageAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      unreadCountForTutor: 0,
      unreadCountForStudent: 1,
    },
    {
      id: "conv-5",
      tutorId: "tutor-3",
      studentId: "student-1",
      lastMessageAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
      unreadCountForTutor: 0,
      unreadCountForStudent: 0,
    },
  ];

  const offers = [
    {
      id: "offer-1",
      conversationId: "conv-1",
      tutorId: "tutor-1",
      studentId: "student-1",
      courseTitle: "Advanced Calculus - 4 Weeks",
      summary:
        "Weekly 2hr sessions covering integrals, derivatives and exam prep.",
      startDate: "2026-07-28",
      endDate: "2026-08-25",
      time: "10:00 AM - 12:00 PM",
      amount: 120,
      status: "pending",
      createdAt: new Date(now - 1000 * 60 * 4).toISOString(),
      editedAt: null,
    },
    {
      id: "offer-2",
      conversationId: "conv-2",
      tutorId: "tutor-1",
      studentId: "student-2",
      courseTitle: "Physics Fundamentals",
      summary: "Intro to mechanics and thermodynamics, 3 sessions per week.",
      startDate: "2026-07-20",
      endDate: "2026-08-10",
      time: "2:00 PM - 3:30 PM",
      amount: 200,
      status: "accepted",
      createdAt: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
      editedAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "offer-3",
      conversationId: "conv-3",
      tutorId: "tutor-1",
      studentId: "student-3",
      courseTitle: "Algebra Intensive",
      summary: "Daily practice for upcoming exams.",
      startDate: "2026-07-15",
      endDate: "2026-07-30",
      time: "9:00 AM - 10:00 AM",
      amount: 80,
      status: "rejected",
      createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
      editedAt: null,
    },
    {
      id: "offer-4",
      conversationId: "conv-4",
      tutorId: "tutor-2",
      studentId: "student-1",
      courseTitle: "Data Structures Crash Course",
      summary: "Learn arrays, trees, graphs with coding exercises.",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      time: "4:00 PM - 6:00 PM",
      amount: 150,
      status: "pending",
      createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      editedAt: null,
    },
    {
      id: "offer-5",
      conversationId: "conv-5",
      tutorId: "tutor-3",
      studentId: "student-1",
      courseTitle: "Essay Writing Workshop",
      summary: "Improve academic writing, 6 sessions.",
      startDate: "2026-07-10",
      endDate: "2026-07-24",
      time: "11:00 AM - 12:30 PM",
      amount: 90,
      status: "accepted",
      createdAt: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
      editedAt: null,
    },
  ];

  // Messages: need text messages for live conv + paired offer messages for each offer
  const messages = [
    // conv-1 text history
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "student-1",
      senderRole: "student",
      type: "text",
      content: "Hi Dr. Chen! I need help with integrals for my final exam.",
      timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      deleted: false,
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "tutor-1",
      senderRole: "tutor",
      type: "text",
      content:
        "Hello Alex! Absolutely, we can schedule 2hr sessions twice a week. What times work for you?",
      timestamp: new Date(now - 1000 * 60 * 60 * 2 + 10000).toISOString(),
      deleted: false,
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      senderId: "student-1",
      senderRole: "student",
      type: "text",
      content: "Mornings around 10am WAT would be perfect. 4 weeks?",
      timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
      deleted: false,
    },
    // conv-1 offer message (paired)
    {
      id: "msg-offer-1",
      conversationId: "conv-1",
      senderId: "tutor-1",
      senderRole: "tutor",
      type: "offer",
      content: "offer-1",
      timestamp: offers[0].createdAt,
      deleted: false,
    },
    // other convs offer messages
    {
      id: "msg-offer-2",
      conversationId: "conv-2",
      senderId: "tutor-1",
      senderRole: "tutor",
      type: "offer",
      content: "offer-2",
      timestamp: offers[1].createdAt,
      deleted: false,
    },
    {
      id: "msg-offer-3",
      conversationId: "conv-3",
      senderId: "tutor-1",
      senderRole: "tutor",
      type: "offer",
      content: "offer-3",
      timestamp: offers[2].createdAt,
      deleted: false,
    },
    {
      id: "msg-offer-4",
      conversationId: "conv-4",
      senderId: "tutor-2",
      senderRole: "tutor",
      type: "offer",
      content: "offer-4",
      timestamp: offers[3].createdAt,
      deleted: false,
    },
    {
      id: "msg-offer-5",
      conversationId: "conv-5",
      senderId: "tutor-3",
      senderRole: "tutor",
      type: "offer",
      content: "offer-5",
      timestamp: offers[4].createdAt,
      deleted: false,
    },
    // some text for other convs
    {
      id: "msg-4",
      conversationId: "conv-2",
      senderId: "student-2",
      senderRole: "student",
      type: "text",
      content: "Thanks for the offer!",
      timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
      deleted: false,
    },
    {
      id: "msg-5",
      conversationId: "conv-4",
      senderId: "student-1",
      senderRole: "student",
      type: "text",
      content: "Could we adjust the timing to evening?",
      timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      deleted: false,
    },
  ];

  localStorage.setItem("studyPod_profiles", JSON.stringify(profiles));
  localStorage.setItem("studyPod_stats", JSON.stringify(stats));
  localStorage.setItem("studyPod_conversations", JSON.stringify(conversations));
  localStorage.setItem("studyPod_offers", JSON.stringify(offers));
  localStorage.setItem("studyPod_messages", JSON.stringify(messages));
}

function ensureSeed() {
  const hasAny = STORAGE_KEYS.some((k) => {
    const v = localStorage.getItem(k);
    try {
      const arr = JSON.parse(v || "[]");
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  });
  if (!hasAny) seedDemoData();
}

export async function initApp(role) {
  ensureSeed();

  const currentUserId = role === "tutor" ? DEMO_TUTOR_ID : DEMO_STUDENT_ID;

  const store = createStore({
    currentUserId,
    currentRole: role,
    activeConversationId: null,
    leftCollapsed: false,
    rightCollapsed: false,
  });

  // Handle reset
  store.subscribe("ui:requestReset", () => {
    if (confirm("Reset demo data? This will clear all messages and offers.")) {
      seedDemoData();
      store.publish("conversations:changed", null);
      store.publish("messages:changed", null);
      store.publish("offers:changed", null);
      store.publish("profiles:changed", null);
      // re-select first conv
      ConversationService.listConversations(currentUserId, role).then(
        (convs) => {
          if (convs.length) {
            store.setState({ activeConversationId: convs[0].id });
            store.publish("activeConversation:changed", convs[0]);
          }
        },
      );
    }
  });

  const appRoot = document.getElementById("app");
  if (!appRoot) throw new Error("#app not found");
  appRoot.className = "app-shell";

  // Header container
  const headerEl = document.createElement("div");
  headerEl.id = "header-root";
  appRoot.appendChild(headerEl);

  // Main grid
  const mainEl = document.createElement("div");
  mainEl.className = "app-main";
  mainEl.id = "main-grid";
  appRoot.appendChild(mainEl);

  // Left nav container (desktop)
  const leftNavEl = document.createElement("div");
  leftNavEl.id = "left-nav-root";
  mainEl.appendChild(leftNavEl);

  // Chat container
  const chatEl = document.createElement("div");
  chatEl.id = "chat-root";
  mainEl.appendChild(chatEl);

  // Right panel
  const rightEl = document.createElement("div");
  rightEl.id = "right-root";
  mainEl.appendChild(rightEl);

  // Mobile overlay for left nav
  const overlay = document.createElement("div");
  overlay.className = "left-nav-overlay";
  overlay.id = "mobile-overlay";
  const backdrop = document.createElement("div");
  backdrop.className = "left-nav-overlay-backdrop";
  const mobileNav = document.createElement("div");
  mobileNav.className = "left-nav";
  mobileNav.id = "left-nav-mobile";
  overlay.appendChild(backdrop);
  overlay.appendChild(mobileNav);
  document.body.appendChild(overlay);

  function closeMobile() {
    overlay.classList.remove("open");
  }
  function openMobile() {
    overlay.classList.add("open");
  }
  backdrop.addEventListener("click", closeMobile);
  store.subscribe("ui:toggleLeftMobile", () => openMobile());
  store.subscribe("ui:closeLeftMobile", () => closeMobile());

  // collapse handling for grid classes
  function updateGridCollapse() {
    const s = store.getState();
    mainEl.classList.toggle("left-collapsed", s.leftCollapsed);
    mainEl.classList.toggle("right-collapsed", s.rightCollapsed);
    mainEl.classList.toggle(
      "both-collapsed",
      s.leftCollapsed && s.rightCollapsed,
    );
  }
  document.addEventListener("leftCollapseChanged", updateGridCollapse);
  document.addEventListener("rightCollapseChanged", updateGridCollapse);
  store.subscribe("state:changed", updateGridCollapse);

  // Components
  const headerComp = createHeader({ store, profileService: ProfileService });
  headerComp.mount(headerEl);

  const leftNavComp = createLeftNav({
    store,
    conversationService: ConversationService,
    profileService: ProfileService,
    offerService: OfferService,
  });
  leftNavComp.mount(leftNavEl);

  // mobile left nav is second instance sharing same logic? For simplicity, clone behavior by mounting same component logic on mobileNav but sharing store.
  const mobileNavComp = createLeftNav({
    store,
    conversationService: ConversationService,
    profileService: ProfileService,
    offerService: OfferService,
  });
  mobileNavComp.mount(mobileNav);

  const rightComp = createRightPanel({ store, profileService: ProfileService });
  rightComp.mount(rightEl);

  const chatComp = createChatWindow({
    store,
    chatService: ChatService,
    offerService: OfferService,
    conversationService: ConversationService,
    profileService: ProfileService,
  });
  chatComp.mount(chatEl);

  const offerFormComp = createOfferForm({ store, offerService: OfferService });
  offerFormComp.mount();

  // Initial active conversation: most recent
  const convs = await ConversationService.listConversations(
    currentUserId,
    role,
  );
  if (convs.length) {
    const mostRecent = convs[0];
    store.setState({ activeConversationId: mostRecent.id });
    store.publish("activeConversation:changed", mostRecent);
    // clear unread for initial
    await ConversationService.clearUnread(mostRecent.id, role);
    store.publish("conversations:changed", null);
  } else {
    store.publish("activeConversation:changed", null);
  }

  updateGridCollapse();

  // Expose reset for console
  window.studyPodReset = () => {
    seedDemoData();
    location.reload();
  };
}
