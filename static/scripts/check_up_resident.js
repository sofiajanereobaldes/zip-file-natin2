const header = document.getElementById("mainHeader");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}
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

// ----- Tabs -----
const tabs = document.querySelectorAll(".tab");
const sectionHistory = document.getElementById("section-history");
const sectionAppointment = document.getElementById("section-appointment");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const key = tab.dataset.tab;
    sectionHistory.classList.toggle("hidden", key !== "history");
    sectionAppointment.classList.toggle("hidden", key !== "appointment");
  });
});

// ----- Load resident basic info -----
async function loadResident() {
  try {
    const res = await fetch("/api/resident/me", { credentials: "include" });
    if (!res.ok) return;
    const u = await res.json();
    document.getElementById("residentName").textContent = u.name;
    document.getElementById("residentId").textContent = "Resident ID: " + u.resident_id;
    document.getElementById("menuResidentName").textContent = u.name;
    document.getElementById("menuResidentId").textContent = "Resident ID: " + u.resident_id;

    // prefill form
    document.getElementById("fieldName").value = u.name || "";
    document.getElementById("fieldDob").value = u.dob || "";
    document.getElementById("fieldAge").value = u.age || "";
    document.getElementById("fieldGender").value = u.gender || "";
    document.getElementById("fieldEmail").value = u.email || "";
    document.getElementById("fieldPhone").value = u.phone || "";
    document.getElementById("fieldAddress").value = u.address || "";
    document.getElementById("fieldEmergency").value = u.emergency_contact || "";
  } catch (e) {
    console.warn("Unable to load resident info");
  }
}

  // ----- Load history -----
  async function loadHistory() {
    const tbody = document.getElementById("historyBody");
    const loading = document.getElementById("historyLoading");
    const totalRecords = document.getElementById("totalRecords");
    const totalSummary = document.getElementById("totalSummary");

    try {
      const res = await fetch("/api/resident/history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed history");
      const rows = await res.json(); // [{date,time,vitals:{bp,hr,temp,weight},symptoms,prescription,doctor}, ...]

      loading.style.display = "none";
      tbody.innerHTML = "";
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;color:#6b7280;">No medical records yet. Your completed check-ups will appear here.</td></tr>';
        totalRecords.textContent = "Total Records: 0";
        totalSummary.textContent = "No records yet";
        return;
      }

      rows.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>
            <div class="vital-line">BP: ${r.vitals.bp}</div>
            <div class="vital-line">HR: ${r.vitals.hr} bpm</div>
            <div class="vital-line">Temp: ${r.vitals.temp}</div>
            <div class="vital-line">Weight: ${r.vitals.weight}</div>
          </td>
          <td>${r.symptoms}</td>
          <td>${r.prescription}</td>
          <td>${r.doctor}</td>
        `;
        tbody.appendChild(tr);
      });

      totalRecords.textContent = "Total Records: " + rows.length;
      totalSummary.textContent = rows.length + " record(s) in your history";
    } catch (e) {
      loading.textContent = "Unable to load history. Please try again later.";
    }
  }

  // ----- Character counters -----
  function attachCounters() {
    document.querySelectorAll("textarea[maxlength]").forEach((ta) => {
      const max = parseInt(ta.getAttribute("maxlength"), 10);
      const counter = document.querySelector(
        '.char-counter[data-counter-for="' + ta.id + '"]'
      );
      if (!counter) return;
      const update = () => {
        const len = ta.value.length;
        counter.textContent = len + " / " + max;
      };
      ta.addEventListener("input", update);
      update();
    });
  }

  // ----- Form validation & submit -----
  const form = document.getElementById("appointmentForm");
  const btnSubmit = document.getElementById("btnSubmit");
  const statusEl = document.getElementById("formStatus");

  function validateFutureDate(input) {
    if (!input.value) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(input.value);
    return d >= today;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "status-message";

    let valid = true;

    // required fields
    form.querySelectorAll("[required]").forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = "#b91c1c";
        valid = false;
      } else {
        field.style.borderColor = "#d1d5db";
      }
    });

    // date validation
    const dateInput = document.getElementById("fieldDate");
    if (!validateFutureDate(dateInput)) {
      dateInput.style.borderColor = "#b91c1c";
      valid = false;
      statusEl.textContent = "Appointment date must be today or in the future.";
      statusEl.classList.add("status-error");
    }

    if (!valid) return;

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Booking…";

    const payload = {
      name: form.name.value.trim(),
      dob: form.dob.value,
      age: form.age.value,
      gender: form.gender.value,
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      emergency: form.emergency.value.trim(),
      reason: form.reason.value.trim(),
      type: form.type.value,
      date: form.date.value,
      time: form.time.value,
      symptoms: form.symptoms.value.trim(),
      history: form.history.value.trim(),
      medications: form.medications.value.trim(),
      lifestyle: form.lifestyle.value.trim()
    };

    try {
      const res = await fetch("/api/resident/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Submit failed");

      statusEl.textContent = "Appointment request submitted successfully. You will be notified once confirmed.";
      statusEl.classList.add("status-success");

      // refresh history / officials queue handled on backend;
      // optionally reload history to show pending entry
      loadHistory();
      form.reset();
      attachCounters();
    } catch (err) {
      statusEl.textContent = "Could not submit appointment. Please try again later.";
      statusEl.classList.add("status-error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "📅 Book Appointment";
    }
  });

  // ----- Init -----
  loadResident();
  loadHistory();
  attachCounters();