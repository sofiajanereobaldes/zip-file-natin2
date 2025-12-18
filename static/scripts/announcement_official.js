// Sticky header
const header = document.getElementById("mainHeader");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}

// Profile dropdown + logout
const profileChip = document.querySelector(".profile-chip");

if (profileChip) {
  const profileMenu = document.createElement("div");
  profileMenu.className = "profile-menu";
  profileMenu.innerHTML = `
    <ul>
      <li data-action="logout">Log Out</li>
    </ul>
  `;
  document.body.appendChild(profileMenu);

  profileChip.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = profileChip.getBoundingClientRect();
    profileMenu.style.top = rect.bottom + 8 + "px";
    profileMenu.style.right = window.innerWidth - rect.right + "px";
    profileMenu.classList.toggle("open");
  });

  document.addEventListener("click", () => profileMenu.classList.remove("open"));

  profileMenu.addEventListener("click", async (e) => {
    e.stopPropagation();
    const li = e.target.closest("li");
    if (!li) return;
    const action = li.dataset.action;

    if (action === "logout") {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login/official";
    }
  });
}

// -------- Modal open/close --------
const createModal = document.getElementById("createModal");
const btnOpenCreateModal = document.getElementById("btnOpenCreateModal");
const btnCloseCreateModal = document.getElementById("btnCloseCreateModal");
const btnCancelCreate = document.getElementById("btnCancelCreate");
const createForm = document.getElementById("createAnnouncementForm");

function openCreateModal() {
  createModal.classList.add("open");
}
function closeCreateModal() {
  createModal.classList.remove("open");
  createForm.reset();
  document.getElementById("imageFile").value = "";
  document.getElementById("imageUrl").value = "";
}

btnOpenCreateModal?.addEventListener("click", openCreateModal);
btnCloseCreateModal?.addEventListener("click", closeCreateModal);
btnCancelCreate?.addEventListener("click", closeCreateModal);
createModal?.addEventListener("click", (e) => {
  if (e.target === createModal) closeCreateModal();
});

// -------- Helpers --------
const pinnedList = document.getElementById("pinnedList");
const allList = document.getElementById("allList");
const annCount = document.getElementById("annCount");
const filterButtons = document.querySelectorAll(".ann-filter-btn");
let currentCategory = "all";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  }); // [web:73]
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// -------- Load announcements --------
async function loadAnnouncements() {
  const params = new URLSearchParams();
  if (currentCategory !== "all") params.set("category", currentCategory);

  const data = await apiFetch(`/api/announcements?${params.toString()}`);
  const pinned = data.filter((a) => a.is_pinned);
  const others = data.filter((a) => !a.is_pinned);

  renderCards(pinnedList, pinned);
  renderCards(allList, others);
  if (annCount) annCount.textContent = `${data.length} total announcements`;
}

function renderCards(container, list) {
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML =
      '<p style="font-size:14px;color:#6b7280;">No announcements.</p>';
    return;
  }

  list.forEach((a) => {
    const card = document.createElement("article");
    card.className = "ann-card";
    card.dataset.id = a.id;

    const created = new Date(a.created_at);
    const dateLabel = created.toLocaleDateString() + " at " + created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    card.innerHTML = `
      <img src="${a.image_url || "https://images.pexels.com/photos/7578800/pexels-photo-7578800.jpeg?auto=compress&cs=tinysrgb&w=1200"}" alt="${a.title}">
      <div class="ann-card-body">
        <div class="ann-card-meta">
          <div>
            ${
              a.is_pinned
                ? '<span class="ann-badge-pinned">📌 Pinned</span>'
                : ""
            }
            <span style="margin-left:8px;">${dateLabel}</span>
          </div>
          <span>${(a.category || "General")
            .charAt(0)
            .toUpperCase()}${(a.category || "General").slice(1)}</span>
        </div>
        <h3 class="ann-card-title">${a.title}</h3>
        <p class="ann-card-content clamped">${a.content}</p>
        ${
          a.link
            ? `<a href="${a.link}" target="_blank" style="font-size:13px;color:#0f766e;">Read more</a>`
            : ""
        }
        <div class="ann-card-footer">
          <span></span>
          <div class="ann-card-actions">
            <button class="ann-icon-btn pin ${a.is_pinned ? "pin-active" : ""}" title="Pin / Unpin">
              📌
            </button>
            <button class="ann-icon-btn delete" title="Delete">
              🗑
            </button>
          </div>
        </div>
        <span class="ann-read-more">Read more</span>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach per‑card handlers
  container.querySelectorAll(".ann-read-more").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.previousElementSibling.previousElementSibling; // .ann-card-content
      p.classList.toggle("clamped");
      btn.textContent = p.classList.contains("clamped") ? "Read more" : "Show less";
    });
  });

  container.querySelectorAll(".ann-icon-btn.pin").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.currentTarget.closest(".ann-card");
      const id = card.dataset.id;
       // use /announcement/api/<id>/pin
    try {
      const currentPinned = btn.classList.contains("pin-active");
      const res = await apiFetch(`/announcement/api/${id}/pin`, {
        method: "POST",
        body: JSON.stringify({ is_pinned: !currentPinned }),
      });
      // optional: update UI without full reload
      btn.classList.toggle("pin-active", res.is_pinned);
      loadAnnouncements();
    } catch {
      alert("Unable to update pin state.");
    }
  });
});

  container.querySelectorAll(".ann-icon-btn.delete").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const card = e.currentTarget.closest(".ann-card");
    const id = card.dataset.id;
    if (!confirm("Delete this announcement?")) return;
    try {
      await apiFetch(`/announcement/api/${id}`, { method: "DELETE" });
      loadAnnouncements();
    } catch {
      alert("Unable to delete announcement.");
    }
  });
});
}

// -------- Create announcement submit --------
createForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(createForm);
  const body = {
    title: formData.get("title"),
    content: formData.get("content"),
    link: formData.get("link") || null,
    pinned: formData.get("pinned") === "on",
    category: formData.get("category") || "general",
    image_url: document.getElementById("imageUrl").value || null
  };
  await apiFetch("/api/announcements", {
    method: "POST",
    body: JSON.stringify(body)
  }); // backend stamps created_at automatically [web:68][web:74]
  closeCreateModal();
  loadAnnouncements();
});

// -------- Category filter buttons --------
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    loadAnnouncements();
  });
});

// Initial load
if (pinnedList && allList) {
  loadAnnouncements();
}
