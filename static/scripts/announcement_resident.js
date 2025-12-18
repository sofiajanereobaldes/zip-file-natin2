// Sticky header
const header = document.getElementById("mainHeader");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}

// Profile dropdown
const profileChipEl = document.getElementById("profileChip");
const profileMenuEl = document.querySelector(".profile-menu");

if (profileChipEl && profileMenuEl) {
  profileChipEl.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenuEl.classList.toggle("open");
  });

  document.addEventListener("click", () => profileMenuEl.classList.remove("open"));

  profileMenuEl.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const action = li.dataset.action;
    if (action === "profile") {
      window.location.href = "/resident/profile";
    } else if (action === "logout") {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login/resident";
    }
  });
}

// Back button
const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    const url = backBtn.dataset.homeUrl;  
    console.log("Going to:", url);  
    window.location.href = url;
  });
} 

// Helpers
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " at " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function detectActionLabel(link) {
  if (!link) return null;
  const lower = link.toLowerCase();
  if (lower.includes("forms") || lower.includes("apply")) return "Apply";
  if (lower.includes("register")) return "Register";
  if (lower.includes("survey")) return "Open Survey";
  return "Open Link";
}

// Load resident (optional – remove if you don't have /api/resident/me yet)
async function loadResident() {
  try {
    const res = await fetch("/api/resident/me", { credentials: "include" });
    if (!res.ok) return;
    const user = await res.json();
    const residentName = document.getElementById("residentName");
    const residentId = document.getElementById("residentId");
    const menuResidentName = document.getElementById("menuResidentName");
    const menuResidentId = document.getElementById("menuResidentId");
    if (residentName) residentName.textContent = user.name;
    if (residentId) residentId.textContent = "Resident ID: " + user.resident_id;
    if (menuResidentName) menuResidentName.textContent = user.name;
    if (menuResidentId) menuResidentId.textContent = "Resident ID: " + user.resident_id;
  } catch (e) {
    console.warn("Unable to load resident info");
  }
}

// Load announcements
async function loadAnnouncements() {
  const listEl = document.getElementById("annList");
  const emptyEl = document.getElementById("emptyState");
  if (!listEl || !emptyEl) return;

  try {
    const res = await fetch("/api/announcements", { credentials: "include" });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();

    if (!data.length) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    listEl.innerHTML = "";

    data.forEach((a) => {
      const card = document.createElement("article");
      card.className = "ann-card";

      const actionLabel = detectActionLabel(a.link);

      card.innerHTML = `
        <img class="ann-image"
             src="${a.image_url || "https://images.pexels.com/photos/7578800/pexels-photo-7578800.jpeg?auto=compress&cs=tinysrgb&w=1200"}"
             alt="${a.title}">
        <div class="ann-body">
          <div class="ann-meta-row">
            <div>
              ${a.is_pinned ? '<span class="ann-badge-pinned">📌 Important</span>' : ""}
              <span style="margin-left:8px;">${formatDate(a.created_at)}</span>
            </div>
            <span>${a.author || "Barangay Health Official"}</span>
          </div>

          <h2 class="ann-title">${a.title}</h2>

          <p class="ann-content clamp">${a.content}</p>
          <span class="ann-more-toggle">more</span>

          <div class="ann-footer">
            <span>${a.category || "Community Update"}</span>
            <div class="ann-actions">
              ${
                actionLabel
                  ? `<button class="ann-btn ann-btn-primary" data-link="${a.link}">
                       ${actionLabel}
                     </button>`
                  : ""
              }
          </div>
        </div>
      `;

      listEl.appendChild(card);
    });

    // Read more / show less
    listEl.querySelectorAll(".ann-more-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const p = toggle.previousElementSibling;
        const isClamped = p.classList.contains("clamp");
        p.classList.toggle("clamp", !isClamped);
        toggle.textContent = isClamped ? "show less" : "more";
      });
    });

    // Action buttons
    listEl.querySelectorAll(".ann-btn-primary[data-link]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-link");
        if (url) window.open(url, "_blank");
      });
    });
  } catch (err) {
    console.error(err);
    listEl.innerHTML = "";
    emptyEl.style.display = "block";
  }
}

// Init
loadResident();
loadAnnouncements();
