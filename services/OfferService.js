const OFFERS_KEY = "studyPod_offers";
const MSG_KEY = "studyPod_messages";
const CONV_KEY = "studyPod_conversations";

function readOffers() {
  try {
    return JSON.parse(localStorage.getItem(OFFERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeOffers(arr) {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(arr));
}

function readMsgs() {
  try {
    return JSON.parse(localStorage.getItem(MSG_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeMsgs(arr) {
  localStorage.setItem(MSG_KEY, JSON.stringify(arr));
}

function readConvs() {
  try {
    return JSON.parse(localStorage.getItem(CONV_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeConvs(arr) {
  localStorage.setItem(CONV_KEY, JSON.stringify(arr));
}

export const OfferService = {
  getOffer(id) {
    const offer = readOffers().find((o) => o.id === id) || null;
    return Promise.resolve(offer);
  },

  getOffersByConversation(conversationId) {
    const offers = readOffers().filter(
      (o) => o.conversationId === conversationId,
    );
    offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return Promise.resolve(offers);
  },

  getOfferSummary(conversationIds) {
    const all = readOffers();
    const byConversation = {};
    const counts = { pending: 0, accepted: 0, rejected: 0 };

    for (const cid of conversationIds) {
      const offersForConv = all
        .filter((o) => o.conversationId === cid)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latest = offersForConv[0] || null;
      byConversation[cid] = latest ? latest.status : null;
      if (latest) counts[latest.status] = (counts[latest.status] || 0) + 1;
    }

    // also counts across all offers? Use latest-per-conv as spec says
    return Promise.resolve({ byConversation, counts });
  },

  createOffer(data) {
    // enforce one pending per conversation
    const existing = readOffers().find(
      (o) => o.conversationId === data.conversationId && o.status === "pending",
    );
    if (existing) {
      return Promise.reject(
        new Error("One pending offer already exists for this conversation"),
      );
    }

    const offer = {
      id: crypto.randomUUID(),
      conversationId: data.conversationId,
      tutorId: data.tutorId,
      studentId: data.studentId,
      courseTitle: data.courseTitle,
      summary: data.summary,
      startDate: data.startDate,
      endDate: data.endDate,
      time: data.time,
      amount: Number(data.amount),
      status: "pending",
      createdAt: new Date().toISOString(),
      editedAt: null,
    };

    const offers = readOffers();
    offers.push(offer);
    writeOffers(offers);

    // create paired message atomically
    const msgs = readMsgs();
    const msg = {
      id: crypto.randomUUID(),
      conversationId: data.conversationId,
      senderId: data.tutorId,
      senderRole: "tutor",
      type: "offer",
      content: offer.id,
      timestamp: offer.createdAt,
      deleted: false,
    };
    msgs.push(msg);
    writeMsgs(msgs);

    // update conversation lastMessageAt + unread for student
    const convs = readConvs();
    const conv = convs.find((c) => c.id === data.conversationId);
    if (conv) {
      conv.lastMessageAt = offer.createdAt;
      conv.unreadCountForStudent = (conv.unreadCountForStudent || 0) + 1;
      writeConvs(convs);
    }

    return Promise.resolve(offer);
  },

  updateOffer(id, updates) {
    const offers = readOffers();
    const idx = offers.findIndex((o) => o.id === id);
    if (idx === -1) return Promise.reject(new Error("Offer not found"));
    const current = offers[idx];
    if (current.status !== "pending") {
      return Promise.reject(new Error("Only pending offers can be edited"));
    }
    // only allow editing specific fields
    const allowed = [
      "courseTitle",
      "summary",
      "startDate",
      "endDate",
      "time",
      "amount",
    ];
    for (const k of allowed) {
      if (k in updates)
        current[k] = k === "amount" ? Number(updates[k]) : updates[k];
    }
    current.editedAt = new Date().toISOString();
    writeOffers(offers);
    return Promise.resolve(current);
  },

  acceptOffer(id) {
    const offers = readOffers();
    const offer = offers.find((o) => o.id === id);
    if (!offer) return Promise.reject(new Error("Offer not found"));
    if (offer.status !== "pending")
      return Promise.reject(new Error("Offer already decided"));
    offer.status = "accepted";
    writeOffers(offers);
    return Promise.resolve(offer);
  },

  rejectOffer(id) {
    const offers = readOffers();
    const offer = offers.find((o) => o.id === id);
    if (!offer) return Promise.reject(new Error("Offer not found"));
    if (offer.status !== "pending")
      return Promise.reject(new Error("Offer already decided"));
    offer.status = "rejected";
    writeOffers(offers);
    return Promise.resolve(offer);
  },

  // No delete method — intentional

  _read() {
    return readOffers();
  },
};
