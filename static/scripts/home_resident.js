// Sticky header
const header = document.getElementById("mainHeader");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}

// =============================
// RESIDENT PROFILE DROPDOWN + LOGOUT
// =============================

// Profile dropdown
const profileChipEl = document.getElementById("residentProfileChip");
const profileMenuEl = document.querySelector(".profile-menu");

if (profileChipEl && profileMenuEl) {
  profileChipEl.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenuEl.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!profileMenuEl.contains(e.target) && e.target !== profileChipEl) {
      profileMenuEl.classList.remove("open");
    }
  });

  profileMenuEl.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const action = li.dataset.action;

    if (action === "logout") {
      try {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
      } catch (err) {
        console.error("Logout failed", err);
      }
      window.location.href = typeof LOGIN_RESIDENT_URL !== "undefined"
        ? LOGIN_RESIDENT_URL
        : "/login/resident";

    }
  });
}

const listEl = document.getElementById("residentAnnouncements");

async function apiJson(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function loadResidentAnnouncements() {
  const all = await apiJson("/api/announcements");
  const pinned = all.filter(a => a.is_pinned);
  const recent = all
    .filter(a => !a.is_pinned)
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 2 - Math.min(pinned.length, 2)); // fill remaining slots

  const toShow = [...pinned.slice(0,2), ...recent];
  renderCards(toShow);
}

function renderCards(list) {
  listEl.innerHTML = "";
  if (!list.length) {
    listEl.innerHTML = `<p style="font-size:14px;color:#6b7280;">No announcements yet.</p>`;
    return;
  }

  list.forEach(a => {
    const card = document.createElement("article");
    card.className = "card";
    const created = new Date(a.created_at).toLocaleDateString();
    const imgSrc = a.image_url || "https://images.pexels.com/photos/7578800/pexels-photo-7578800.jpeg?auto=compress&cs=tinysrgb&w=1200";

    card.innerHTML = `
      <img class="card-image" src="${imgSrc}" alt="${a.title}">
      <div class="card-body">
        <div class="card-meta-row">
          <div>
            ${a.is_pinned ? '<span class="badge-pinned">📌 Pinned</span>' : ""}
          </div>
          <span>${created}</span>
        </div>
        <h3 class="card-title">${a.title}</h3>
        <p class="card-text">${a.content}</p>
        <div class="card-footer">
          <span>${a.category || "Announcement"}</span>
        </div>
      </div>
    `;
    listEl.appendChild(card);
  });
}

if (listEl) loadResidentAnnouncements();
