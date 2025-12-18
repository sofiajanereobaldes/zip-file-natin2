// Sticky header
const header = document.getElementById("mainHeader");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}

// PROFILE DROPDOWN + LOGOUT
const profileChip = document.getElementById("profileChip");
const profileMenu = document.getElementById("profileMenu");

if (profileChip && profileMenu) {
  profileChip.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    profileMenu.classList.remove("open");
  });

  profileMenu.addEventListener("click", async (e) => {
    const item = e.target.closest("li");
    if (!item) return;

    const action = item.dataset.action;
    if (action === "logout") {
      await fetch(LOGOUT_URL, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = LOGIN_OFFICIAL_URL;
    }
  });
}

// VIEW ALL ANNOUNCEMENTS BUTTON
const viewAllBtn = document.querySelector(".view-all-btn");
if (viewAllBtn) {
  viewAllBtn.addEventListener("click", () => {
    const url = viewAllBtn.dataset.annUrl;
    if (url) {
      window.location.href = url;
    }
  });
}
