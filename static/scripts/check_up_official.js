// ---------- Profile dropdown ----------
const profileChip = document.getElementById("profileChip");
const profileMenu = document.getElementById("profileMenu");

if (profileChip && profileMenu) {
  profileChip.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("open");
  });
  document.addEventListener("click", () =>
    profileMenu.classList.remove("open")
  );

  profileMenu.addEventListener("click", async (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  if (li.dataset.action === "logout") {
    await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
    window.location.href = LOGIN_OFFICIAL_URL;
  }
});
}

// ---------- Tabs ----------
const tabs = document.querySelectorAll(".tab");
const sectionLog = document.getElementById("section-log");
const sectionAppointments = document.getElementById("section-appointments");

if (tabs.length && sectionLog && sectionAppointments) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const key = tab.dataset.tab;
      sectionLog.classList.toggle("hidden", key !== "log");
      sectionAppointments.classList.toggle("hidden", key !== "appointments");
    });
  });
}

// ---------- Helper for API ----------
async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse error
  }

  if (!res.ok) {
    const msg = data && data.error ? data.error : `API error ${res.status}`;
    throw new Error(msg);
  }
  return data ?? {};
}

    // ---------- Load official (optional) ----------
    async function loadOfficial() {
      try {
        const data = await apiJson("/api/official/me");
        document.getElementById("officialName").textContent = data.name;
        document.getElementById("officialRole").textContent = data.role;
        document.getElementById("menuOfficialName").textContent = data.name;
        document.getElementById("menuOfficialRole").textContent = data.role;
      } catch {}
    }

    // ---------- Medical Log (patients) ----------
    const patientGrid = document.getElementById("patientGrid");
    const totalPatientsText = document.getElementById("totalPatientsText");
    const pageSummary = document.getElementById("pageSummary");

    async function loadPatients() {
      try {
        const patients = await apiJson("/api/official/patients"); // [{id,name,age,gender,phone,email,records_count}, ...] [web:174][web:184]
        patientGrid.innerHTML = "";
        if (!patients.length) {
          patientGrid.innerHTML = '<p style="font-size:14px;color:#6b7280;">No patients yet.</p>';
          totalPatientsText.textContent = "Total Patients: 0";
          pageSummary.textContent = "No patient records yet.";
          return;
        }

        patients.forEach((p) => {
          const card = document.createElement("div");
          card.className = "patient-card";
          card.dataset.id = p.id;
          card.innerHTML = `
            <div class="patient-card-header">
              <div class="patient-avatar">👤</div>
              <div class="patient-main">
                <span>${p.name}</span>
                <span>${p.age} years • ${p.gender}</span>
              </div>
            </div>
            <div class="patient-card-body">
              <div>📞 ${p.phone || "N/A"}</div>
              <div>✉ ${p.email || "N/A"}</div>
              <div>Medical Records: ${p.records_count || 0}</div>
            </div>
          `;
          card.addEventListener("click", () => openRecordsModal(p.id));
          patientGrid.appendChild(card);
        });

        totalPatientsText.textContent = "Total Patients: " + patients.length;
        pageSummary.textContent = patients.length + " patients • medical records update automatically after completed check-ups.";
      } catch (e) {
        patientGrid.innerHTML = '<p style="font-size:14px;color:#b91c1c;">Unable to load patients.</p>';
      }
    }

    // ---------- Records modal ----------
    const recordsModal = document.getElementById("recordsModal");
    const recordsModalTitle = document.getElementById("recordsModalTitle");
    const recordsModalBody = document.getElementById("recordsModalBody");

    document.querySelectorAll("[data-close-records]").forEach((btn) =>
      btn.addEventListener("click", () => recordsModal.classList.remove("open"))
    );
    recordsModal.addEventListener("click", (e) => {
      if (e.target === recordsModal) recordsModal.classList.remove("open");
    });

    async function openRecordsModal(patientId) {
      try {
        const data = await apiJson(`/api/official/patients/${patientId}/records`); // {patient, history, latest_visit}
        const p = data.patient;
        const v = data.latest_visit;

        recordsModalTitle.textContent = `${p.name} – Medical Records`;

        const historyHtml = data.history.length
          ? data.history
              .map(
                (h) =>
                  `<div class="records-row">• ${h.date} ${h.time} – ${h.summary}</div>`
              )
              .join("")
          : '<div class="records-row">No previous records.</div>';

        const latestHtml = v
          ? `
          <div class="records-row"><span class="label">Visit:</span> ${v.date} at ${v.time}</div>
          <div class="records-row"><span class="label">Doctor:</span> ${v.doctor}</div>
          <div class="records-row"><span class="label">Status:</span> ${v.status}</div>
          <h4 style="margin-top:10px;">Vital Signs</h4>
          <div class="records-row"><span class="label">Blood Pressure:</span> ${v.vitals.bp}</div>
          <div class="records-row"><span class="label">Heart Rate:</span> ${v.vitals.hr}</div>
          <div class="records-row"><span class="label">Temperature:</span> ${v.vitals.temp}</div>
          <div class="records-row"><span class="label">Weight:</span> ${v.vitals.weight}</div>
          <h4 style="margin-top:10px;">Assessment</h4>
          <div class="records-row"><span class="label">Symptoms:</span> ${v.symptoms}</div>
          <div class="records-row"><span class="label">Diagnosis:</span> ${v.diagnosis}</div>
          <div class="records-row"><span class="label">Treatment:</span> ${v.treatment}</div>
          <div class="records-row"><span class="label">Medications:</span> ${v.medications}</div>
          <div class="records-row"><span class="label">Notes:</span> ${v.notes}</div>
        `
          : "<div>No completed visits yet.</div>";

        recordsModalBody.innerHTML = `
          <div class="records-panel">
            <h4>Patient Information</h4>
            <div class="records-row"><span class="label">Age:</span> ${p.age} years</div>
            <div class="records-row"><span class="label">Gender:</span> ${p.gender}</div>
            <div class="records-row"><span class="label">Phone:</span> ${p.phone || "N/A"}</div>
            <div class="records-row"><span class="label">Email:</span> ${p.email || "N/A"}</div>
            <div class="records-row"><span class="label">Address:</span> ${p.address || "N/A"}</div>
            <div class="records-row"><span class="label">Emergency Contact:</span> ${p.emergency_contact || "N/A"}</div>
            <h4 style="margin-top:10px;">Medical History</h4>
            ${historyHtml}
          </div>
          <div class="records-panel">
            <h4>Latest Check-up</h4>
            ${latestHtml}
          </div>
        `;
        recordsModal.classList.add("open");
      } catch (e) {
        alert("Unable to load medical records.");
      }
    }

    // ---------- Appointments & Complete Check-up ----------
    const appointmentList = document.getElementById("appointmentList");
    const totalAppointmentsText = document.getElementById("totalAppointmentsText");
    const completeModal = document.getElementById("completeModal");
    const completeModalTitle = document.getElementById("completeModalTitle");
    const completeDetailsHeader = document.getElementById("completeDetailsHeader");
    const completeForm = document.getElementById("completeForm");
    const btnComplete = document.getElementById("btnComplete");

    let currentAppointment = null;

    document
      .querySelectorAll("[data-close-complete]")
      .forEach((btn) =>
        btn.addEventListener("click", () => completeModal.classList.remove("open"))
      );
    completeModal.addEventListener("click", (e) => {
      if (e.target === completeModal) completeModal.classList.remove("open");
    });

    async function loadAppointments() {
      try {
        const data = await apiJson("/api/official/appointments"); // upcoming + in-progress [web:174]
        appointmentList.innerHTML = "";
        if (!data.length) {
          appointmentList.innerHTML =
            '<p style="font-size:14px;color:#6b7280;">No scheduled appointments.</p>';
          totalAppointmentsText.textContent = "Total Appointments: 0";
          return;
        }

        data.forEach((a) => {
          const card = document.createElement("div");
          card.className = "appointment-card";
          const statusClass =
            a.status === "Completed"
              ? "completed"
              : a.status === "In Progress"
              ? "in-progress"
              : "scheduled";

          card.innerHTML = `
            <div class="appointment-patient">
              <div class="patient-avatar">👤</div>
              <div class="appointment-patient-info">
                <span>${a.patient.name}</span>
                <span>${a.reason}</span>
                <span style="font-size:12px;color:#6b7280;">Phone: ${a.patient.phone}</span>
                <span style="font-size:12px;color:#6b7280;">Email: ${a.patient.email}</span>
              </div>
            </div>
            <div class="appointment-meta">
              <div>${a.date}</div>
              <div>${a.time}</div>
              <div>Doctor: ${a.doctor}</div>
            </div>
            <div class="appointment-actions">
              <span class="badge-status ${statusClass}">${a.status}</span>
              ${
                a.status === "Completed"
                  ? ""
                  : `<button class="btn-small-primary" data-complete-id="${a.id}">
                       ${a.status === "In Progress" ? "Continue" : "Start Check-up"}
                     </button>`
              }
            </div>
          `;
          appointmentList.appendChild(card);
        });

        totalAppointmentsText.textContent = "Total Appointments: " + data.length;

        appointmentList.querySelectorAll("[data-complete-id]").forEach((btn) => {
          btn.addEventListener("click", () =>
            openCompleteModal(btn.getAttribute("data-complete-id"))
          );
        });
      } catch (e) {
        console.error("loadAppointments failed:", e.message);
    appointmentList.innerHTML =
      '<p style="font-size:14px;color:#b91c1c;">Unable to load appointments: '
      + e.message + '</p>';
      }
    }

    async function openCompleteModal(appointmentId) {
      try {
        const a = await apiJson(`/api/official/appointments/${appointmentId}`); // full appointment detail
        currentAppointment = a;
        completeModalTitle.textContent = `Complete Check-up – ${a.patient.name}`;
        completeDetailsHeader.innerHTML = `
          <div>Date: <strong>${a.date}</strong></div>
          <div>Time: <strong>${a.time}</strong></div>
          <div>Doctor: <strong>${a.doctor}</strong></div>
          <div>Reason: <strong>${a.reason}</strong></div>
        `;

        completeForm.bp.value = a.vitals?.bp || "";
        completeForm.hr.value = a.vitals?.hr || "";
        completeForm.temp.value = a.vitals?.temp || "";
        completeForm.weight.value = a.vitals?.weight || "";
        completeForm.height.value = a.vitals?.height || "";
        completeForm.symptoms.value = a.symptoms || "";
        completeForm.diagnosis.value = a.diagnosis || "";
        completeForm.treatment.value = a.treatment || "";
        completeForm.medications.value = a.medications || "";
        completeForm.notes.value = a.notes || "";

        completeModal.classList.add("open");
      } catch (e) {
        alert("Unable to load appointment details.");
      }
    }

    completeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentAppointment) return;

      btnComplete.disabled = true;
      btnComplete.textContent = "Saving…";

      const payload = {
        vitals: {
          bp: completeForm.bp.value,
          hr: completeForm.hr.value,
          temp: completeForm.temp.value,
          weight: completeForm.weight.value,
          height: completeForm.height.value
        },
        symptoms: completeForm.symptoms.value,
        diagnosis: completeForm.diagnosis.value,
        treatment: completeForm.treatment.value,
        medications: completeForm.medications.value,
        notes: completeForm.notes.value
      };

      try {
        await apiJson(`/api/official/appointments/${currentAppointment.id}/complete`, {
          method: "POST",
          body: JSON.stringify(payload)
        }); // backend: mark appointment completed + append to patient history [web:184][web:187]

        completeModal.classList.remove("open");
        currentAppointment = null;
        await Promise.all([loadAppointments(), loadPatients()]);
      } catch (e) {
        alert("Unable to complete check-up.");
      } finally {
        btnComplete.disabled = false;
        btnComplete.textContent = "Complete Check-up";
      }
    });

    // ---------- Init ----------
    loadOfficial();
    loadPatients();
    loadAppointments();