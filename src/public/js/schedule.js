let formMode = "search";

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initClassDropdown();
  addClassDropdownListener();
  initInstructorDropdown();
  document.getElementById("addDaytimeBtn").addEventListener("click", addDaytimeRow);
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", () => {
  clearScheduleForm();
  setFormForSearch();
  initClassDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", () => {
  setFormForAdd();
  addDaytimeRow();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  const form    = document.getElementById("scheduleForm");
  const daytime = collectDaytimeRows();

  if (formMode === "add") {
    const res = await fetch("/api/schedule/getNextId");
    const { nextId } = await res.json();

    const classData = {
      classId:      nextId,
      className:    form.className.value.trim(),
      classType:    form.classType.value,
      instructorId: form.instructorId.value,
      description:  form.description.value.trim(),
      daytime,
    };

    try {
      const saveRes = await fetch("/api/schedule/add", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(classData),
      });
      const result = await saveRes.json();
      if (!saveRes.ok) throw new Error(result.message || "Failed to add class");
      alert(`✅ Class ${classData.classId} added successfully!`);
      clearScheduleForm();
      setFormForSearch();
      initClassDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }

  } else if (formMode === "edit") {
    const classId = document.getElementById("classIdText").value;
    const classData = {
      className:    form.className.value.trim(),
      classType:    form.classType.value,
      instructorId: form.instructorId.value,
      description:  form.description.value.trim(),
      daytime,
    };

    try {
      const updateRes = await fetch(`/api/schedule/update?classId=${classId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(classData),
      });
      const result = await updateRes.json();
      if (!updateRes.ok) throw new Error(result.message || "Failed to update class");
      alert(`✅ Class ${classId} updated successfully!`);
      clearScheduleForm();
      setFormForSearch();
      initClassDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const classId = document.getElementById("classIdSelect").value;
  if (!classId) { alert("Please select a class to delete."); return; }
  if (!confirm(`Delete class ${classId}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/schedule/deleteClass?classId=${classId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Class delete failed");
    alert(`✅ Class ${classId} deleted.`);
    clearScheduleForm();
    setFormForSearch();
    initClassDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// GENERATE QR
document.getElementById("generateQrBtn").addEventListener("click", async () => {
  const classId = document.getElementById("classIdSelect").value ||
                  document.getElementById("classIdText").value;

  if (!classId || classId === "Auto-generated") {
    alert("Please select or save a class first.");
    return;
  }

  try {
    const res  = await fetch(`/api/qr/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ classId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate QR");
    showQrModal(data.qrDataUrl, data.className, data.validUntil);
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

function showQrModal(qrDataUrl, className, validUntil) {
  // Remove existing modal if any
  const existing = document.getElementById("qrModal");
  if (existing) existing.remove();

  const until = new Date(validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const modal = document.createElement("div");
  modal.id = "qrModal";
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(61,48,40,0.7);
    display: flex; align-items: center; justify-content: center;
  `;
  modal.innerHTML = `
    <div style="
      background: #f7f3ee; border-radius: 10px; padding: 2.5rem;
      text-align: center; max-width: 380px; width: 90%;
      box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    ">
      <h2 style="font-family:'Fraunces',serif; font-weight:300; color:#3d3028; margin:0 0 0.25rem;">${className}</h2>
      <p style="font-family:'Lato',sans-serif; font-size:12px; color:#9a8e84; margin:0 0 1.5rem; letter-spacing:0.08em; text-transform:uppercase;">Valid until ${until}</p>
      <img src="${qrDataUrl}" alt="QR Code" style="width:220px; height:220px; display:block; margin:0 auto 1.5rem;">
      <p style="font-family:'Lato',sans-serif; font-size:11px; color:#9a8e84; margin:0 0 1.5rem;">Customers scan this code to check in</p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button onclick="window.print()" style="
          padding:.55rem 1.25rem; border-radius:4px; border:1px solid #c2b9a7;
          background:#ede8e0; color:#3d3028; font-family:'Lato',sans-serif;
          font-size:11px; letter-spacing:0.09em; text-transform:uppercase; cursor:pointer;
        ">Print</button>
        <button onclick="document.getElementById('qrModal').remove()" style="
          padding:.55rem 1.25rem; border-radius:4px; border:none;
          background:#7a8c6e; color:#faf8f5; font-family:'Lato',sans-serif;
          font-size:11px; letter-spacing:0.09em; text-transform:uppercase; cursor:pointer;
        ">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function initClassDropdown() {
  const select = document.getElementById("classIdSelect");
  select.innerHTML = '<option value=""> -- Select Class -- </option>';
  try {
    const res     = await fetch("/api/schedule/getClassIds");
    const classes = await res.json();
    classes.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.classId;
      option.textContent = `${c.classId}: ${c.className}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load class IDs:", err);
  }
}

async function initInstructorDropdown() {
  const select = document.getElementById("instructorId");
  try {
    const res        = await fetch("/api/instructor/getInstructorIds");
    const instructors = await res.json();
    instructors.forEach((instr) => {
      const option = document.createElement("option");
      option.value = instr.instructorId;
      option.textContent = `${instr.instructorId}: ${instr.firstname} ${instr.lastname}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load instructors:", err);
  }
}

async function addClassDropdownListener() {
  const form   = document.getElementById("scheduleForm");
  const select = document.getElementById("classIdSelect");

  select.addEventListener("change", async () => {
    const classId = select.value;
    if (!classId) return;

    try {
      const res  = await fetch(`/api/schedule/getClass?classId=${classId}`);
      if (!res.ok) throw new Error("Class search failed");
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) { alert("No class found"); return; }

      form.className.value    = data.className    || "";
      form.classType.value    = data.classType    || "";
      form.instructorId.value = data.instructorId || "";
      form.description.value  = data.description  || "";

      document.getElementById("daytimeList").innerHTML = "";
      (data.daytime || []).forEach((dt) => addDaytimeRow(dt));

      formMode = "edit";
      document.getElementById("classIdText").value = classId;
    } catch (err) {
      alert(`Error loading class: ${err.message}`);
    }
  });
}

function addDaytimeRow(dt = {}) {
  const list = document.getElementById("daytimeList");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const row  = document.createElement("div");
  row.className = "daytime-row grid-2";
  row.style.marginBottom = "0.5rem";
  row.innerHTML = `
    <label style="text-transform:none; font-size:.9rem; font-weight:400;">Day
      <select class="dt-day form-input styled-select">
        ${days.map(d => `<option value="${d}" ${dt.day === d ? "selected" : ""}>${d}</option>`).join("")}
      </select>
    </label>
    <label style="text-transform:none; font-size:.9rem; font-weight:400;">Time
      <input type="time" class="dt-time" value="${dt.time ? dt.time.slice(0,5) : ""}">
    </label>
    <label style="text-transform:none; font-size:.9rem; font-weight:400;">Duration (min)
      <input type="number" class="dt-duration" value="${dt.duration || ""}" min="1">
    </label>
    <div style="display:flex; align-items:flex-end;">
      <button type="button" class="btn btn--danger" style="padding:.4rem .75rem;" onclick="this.closest('.daytime-row').remove()">Remove</button>
    </div>
  `;
  list.appendChild(row);
}

function collectDaytimeRows() {
  const rows = document.querySelectorAll(".daytime-row");
  return Array.from(rows).map((row) => ({
    day:      row.querySelector(".dt-day").value,
    time:     row.querySelector(".dt-time").value + ":00",
    duration: parseInt(row.querySelector(".dt-duration").value),
  }));
}

function clearScheduleForm() {
  document.getElementById("scheduleForm").reset();
  document.getElementById("classIdSelect").innerHTML = '<option value=""> -- Select Class -- </option>';
  document.getElementById("classIdText").value = "";
  document.getElementById("daytimeList").innerHTML = "";
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("classIdLabel").style.display     = "block";
  document.getElementById("classIdTextLabel").style.display = "none";
  document.getElementById("classIdText").style.display      = "none";
  document.getElementById("classIdText").value              = "";
  document.getElementById("scheduleForm").reset();
  document.getElementById("daytimeList").innerHTML = "";
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("classIdLabel").style.display     = "none";
  document.getElementById("classIdTextLabel").style.display = "block";
  document.getElementById("classIdText").removeAttribute("hidden");
  document.getElementById("classIdText").style.display      = "block";
  document.getElementById("classIdText").value              = "Auto-generated";
  document.getElementById("scheduleForm").reset();
  document.getElementById("daytimeList").innerHTML = "";
}
