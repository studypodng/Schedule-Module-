/**
 * OfferForm — modal form for create / edit offer
 */
export function createOfferForm({ store, offerService }) {
  let backdrop = null;
  let currentConversation = null;
  let editingOffer = null;
  let currentUserId = null;

  function validate(data) {
    const errors = {};
    if (!data.courseTitle?.trim()) errors.courseTitle = "Required";
    if (!data.summary?.trim()) errors.summary = "Required";
    if (!data.startDate) errors.startDate = "Required";
    if (!data.endDate) errors.endDate = "Required";
    if (
      data.startDate &&
      data.endDate &&
      new Date(data.endDate) < new Date(data.startDate)
    ) {
      errors.endDate = "End date cannot be before start date";
    }
    if (!data.time?.trim()) errors.time = "Required";
    if (data.amount === "" || data.amount == null) errors.amount = "Required";
    else if (Number(data.amount) <= 0)
      errors.amount = "Amount must be positive";
    return errors;
  }

  function renderForm() {
    if (backdrop) backdrop.remove();
    backdrop = document.createElement("div");
    backdrop.className = "offer-form-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const modal = document.createElement("div");
    modal.className = "offer-form-modal";

    const h2 = document.createElement("h2");
    h2.textContent = editingOffer ? "Edit custom offer" : "Create custom offer";
    modal.appendChild(h2);

    const form = document.createElement("form");
    form.noValidate = true;

    const grid = document.createElement("div");
    grid.className = "form-grid";

    const fields = [
      { name: "courseTitle", label: "Course title", type: "text", full: false },
      { name: "amount", label: "Amount ($)", type: "number", full: false },
      { name: "startDate", label: "Start date", type: "date", full: false },
      { name: "endDate", label: "End date", type: "date", full: false },
      {
        name: "time",
        label: "Time",
        type: "text",
        placeholder: "e.g. 10:00 AM - 11:30 AM",
        full: false,
      },
      { name: "summary", label: "Summary", type: "textarea", full: true },
    ];

    const inputs = {};

    for (const f of fields) {
      const fieldDiv = document.createElement("div");
      fieldDiv.className = `form-field ${f.full ? "full" : ""}`;
      const label = document.createElement("label");
      label.textContent = f.label;
      label.htmlFor = `offer-${f.name}`;
      fieldDiv.appendChild(label);

      let input;
      if (f.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 3;
      } else {
        input = document.createElement("input");
        input.type = f.type;
        if (f.placeholder) input.placeholder = f.placeholder;
        if (f.type === "number") {
          input.min = "1";
          input.step = "1";
        }
      }
      input.id = `offer-${f.name}`;
      input.name = f.name;
      if (editingOffer && editingOffer[f.name] != null) {
        input.value = editingOffer[f.name];
      }
      const errorEl = document.createElement("div");
      errorEl.className = "error";
      fieldDiv.appendChild(input);
      fieldDiv.appendChild(errorEl);
      grid.appendChild(fieldDiv);
      inputs[f.name] = { input, errorEl };
    }

    form.appendChild(grid);

    const actions = document.createElement("div");
    actions.className = "form-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-cancel";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => close());
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn-submit";
    submit.textContent = editingOffer ? "Save changes" : "Create offer";
    actions.appendChild(cancel);
    actions.appendChild(submit);
    form.appendChild(actions);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {};
      for (const [k, { input }] of Object.entries(inputs))
        data[k] = input.value;
      const errors = validate(data);
      // clear previous errors
      for (const { errorEl } of Object.values(inputs)) errorEl.textContent = "";
      if (Object.keys(errors).length) {
        for (const [k, msg] of Object.entries(errors)) {
          if (inputs[k]) inputs[k].errorEl.textContent = msg;
        }
        return;
      }
      try {
        if (editingOffer) {
          await offerService.updateOffer(editingOffer.id, data);
          store.publish("offers:changed", {
            conversationId: currentConversation.id,
          });
        } else {
          // create
          const payload = {
            conversationId: currentConversation.id,
            tutorId: currentConversation.tutorId,
            studentId: currentConversation.studentId,
            ...data,
          };
          await offerService.createOffer(payload);
          store.publish("offers:changed", {
            conversationId: currentConversation.id,
          });
          store.publish("messages:changed", {
            conversationId: currentConversation.id,
          });
          store.publish("conversations:changed", null);
        }
        close();
      } catch (err) {
        alert(err.message);
      }
    });

    modal.appendChild(form);
    backdrop.appendChild(modal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    document.body.appendChild(backdrop);
    // focus first field
    setTimeout(() => inputs.courseTitle?.input.focus(), 50);
  }

  function close() {
    if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
    editingOffer = null;
  }

  return {
    openForCreate(conversation, userId) {
      currentConversation = conversation;
      currentUserId = userId;
      editingOffer = null;
      renderForm();
    },
    openForEdit(offer, conversation) {
      currentConversation = conversation;
      editingOffer = offer;
      renderForm();
    },
    close,
    mount() {
      store.subscribe("ui:createOffer", ({ conversation }) => {
        this.openForCreate(conversation, store.getState().currentUserId);
      });
      store.subscribe("ui:editOffer", (offer) => {
        const state = store.getState();
        // need active conv
        const convId = offer.conversationId;
        // we can get conv from store active or via service — for simplicity use active
        // We'll fetch from localStorage quickly
        const convs = JSON.parse(
          localStorage.getItem("studyPod_conversations") || "[]",
        );
        const conv = convs.find((c) => c.id === convId);
        if (conv) this.openForEdit(offer, conv);
      });
    },
  };
}
