let formMode = "search";

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initInstructorDropdown();
  addInstructorDropdownListener();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
  clearInstructorForm();
  setFormForSearch();
  initInstructorDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", async () => {
  setFormForAdd();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  const form = document.getElementById("instructorForm");

  if (formMode === "add") {
    const res = await fetch("/api/instructor/getNextId");
    const { nextId } = await res.json();
    document.getElementById("instructorIdText").value = nextId;

    const instructorData = {
      instructorId: nextId,
      firstname: form.firstname.value.trim(),
      lastname: form.lastname.value.trim(),
      address: form.address.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      preferredContact: form.pref[0].checked ? "phone" : "email",
    };

    try {
      const res = await fetch("/api/instructor/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instructorData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add instructor");
      alert(`✅ Instructor ${instructorData.instructorId} added successfully!`);
      clearInstructorForm();
      setFormForSearch();
      initInstructorDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }

  } else if (formMode === "search") {
    const select = document.getElementById("instructorIdSelect");
    const instructorId = select.value;

    if (!instructorId) {
      alert("Please select an instructor to update.");
      return;
    }

    const instructorData = {
      instructorId,
      firstname: form.firstname.value.trim(),
      lastname: form.lastname.value.trim(),
      address: form.address.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      preferredContact: form.pref[0].checked ? "phone" : "email",
    };

    try {
      const res = await fetch("/api/instructor/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instructorData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update instructor");
      alert(`✅ Instructor ${instructorId} updated successfully!`);
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const select = document.getElementById("instructorIdSelect");
  const instructorId = select.value;

  if (!instructorId) {
    alert("Please select an instructor to delete.");
    return;
  }

  if (!confirm(`Delete instructor ${instructorId}?`)) return;

  try {
    const response = await fetch(
      `/api/instructor/deleteInstructor?instructorId=${instructorId}`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Instructor delete failed");
    alert(`✅ Instructor ${instructorId} successfully deleted`);
    clearInstructorForm();
    initInstructorDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

async function initInstructorDropdown() {
  const select = document.getElementById("instructorIdSelect");
  select.innerHTML = '<option value="">-- Select Instructor --</option>';
  try {
    const response = await fetch("/api/instructor/getInstructorIds");
    const instructorIds = await response.json();
    instructorIds.forEach((instr) => {
      const option = document.createElement("option");
      option.value = instr.instructorId;
      option.textContent = `${instr.instructorId}: ${instr.firstname} ${instr.lastname}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load instructor IDs:", err);
  }
}

async function addInstructorDropdownListener() {
  const form = document.getElementById("instructorForm");
  const select = document.getElementById("instructorIdSelect");

  select.addEventListener("change", async () => {
    const instructorId = select.value;
    if (!instructorId) return;

    try {
      const res = await fetch(`/api/instructor/getInstructor?instructorId=${instructorId}`);
      if (!res.ok) throw new Error("Instructor search failed");
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) {
        alert("No instructor found");
        return;
      }
      form.firstname.value = data.firstname || "";
      form.lastname.value  = data.lastname  || "";
      form.address.value   = data.address   || "";
      form.phone.value     = data.phone     || "";
      form.email.value     = data.email     || "";
      if (data.preferredContact === "phone") {
        form.pref[0].checked = true;
      } else {
        form.pref[1].checked = true;
      }
    } catch (err) {
      alert(`Error loading instructor: ${err.message}`);
    }
  });
}

function clearInstructorForm() {
  document.getElementById("instructorForm").reset();
  document.getElementById("instructorIdSelect").innerHTML = '<option value="">-- Select Instructor --</option>';
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("instructorIdLabel").style.display = "block";
  document.getElementById("instructorIdTextLabel").style.display = "none";
  document.getElementById("instructorIdText").value = "";
  document.getElementById("instructorIdText").style.display = "none";
  document.getElementById("instructorForm").reset();
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("instructorIdLabel").style.display = "none";
  document.getElementById("instructorIdTextLabel").style.display = "block";
  document.getElementById("instructorIdText").value = "";
  document.getElementById("instructorForm").reset();
}
