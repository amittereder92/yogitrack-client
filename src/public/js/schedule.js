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
  addDaytimeRow(); // Start with one empty row
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  const form = document.getElementById("scheduleForm");
  const daytime = collectDaytimeRows();

  if (formMode === "add") {
    const res = await fetch("/api/schedule/getNextId");
    const { nextId } = await res.json();

    const classData = {
      classId: nextId,
      className: form.className.value.trim(),
      classType: form.classType.value,
      instructorId: form.instructorId.value,
      description: form.description.value.trim(),
      daytime,
    };

    try {
      const saveRes = await fetch("/api/schedule/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
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
      className: form.className.value.trim(),
      classType: form.classType.value,
      instructorId: form.instructorId.value,
      description: form.description.value.trim(),
      daytime,
    };

    try {
      const updateRes = await fetch(`/api/schedule/update?classId=${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
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

async function initClassDropdown() {
  const select = document.getElementById("classIdSelect");
  select.innerHTML = '<option value=""> -- Select Class -- </option>';
  try {
    const res = await fetch("/api/schedule/getClassIds");
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
    const res = await fetch("/api/instructor/getInstructorIds");
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
  const form = document.getElementById("scheduleForm");
  const select = document.getElementById("classIdSelect");

  select.addEventListener("change", async () => {
    const classId = select.value;
    if (!classId) return;

    try {
      const res = await fetch(`/api/schedule/getClass?classId=${classId}`);
      if (!res.ok) throw new Error("Class search failed");
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) { alert("No class found"); return; }

      form.className.value = data.className || "";
      form.classType.value = data.classType || "";
      form.instructorId.value = data.instructorId || "";
      form.description.value = data.description || "";

      // Populate daytime rows
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
  const row = document.createElement("div");
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
    day: row.querySelector(".dt-day").value,
    time: row.querySelector(".dt-time").value + ":00",
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
  document.getElementById("classIdLabel").style.display = "block";
  document.getElementById("classIdTextLabel").style.display = "none";
  document.getElementById("classIdText").style.display = "none";
  document.getElementById("classIdText").value = "";
  document.getElementById("scheduleForm").reset();
  document.getElementById("daytimeList").innerHTML = "";
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("classIdLabel").style.display = "none";
  document.getElementById("classIdTextLabel").style.display = "block";
  document.getElementById("classIdText").removeAttribute("hidden");
  document.getElementById("classIdText").style.display = "block";
  document.getElementById("classIdText").value = "Auto-generated";
  document.getElementById("scheduleForm").reset();
  document.getElementById("daytimeList").innerHTML = "";
}
