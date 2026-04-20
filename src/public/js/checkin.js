const MIN_BALANCE = -5;

document.addEventListener("DOMContentLoaded", () => {
  initDropdowns();
  loadCheckins();
});

async function initDropdowns() {
  await loadCustomerDropdown();
  await loadClassDropdown();
  await loadInstructorDropdown();
  const now = new Date();
  now.setSeconds(0, 0);
  document.getElementById("checkinDatetime").value = now.toISOString().slice(0, 16);
}

async function loadCustomerDropdown() {
  const select = document.getElementById("customerSelect");
  select.innerHTML = '<option value="">-- Select Customer --</option>';
  try {
    const res       = await fetch("/api/customer/getCustomerIds");
    const customers = await res.json();
    customers.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.customerId;
      option.textContent = `${c.customerId}: ${c.firstName} ${c.lastName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load customers:", err);
  }
}

async function loadClassDropdown() {
  const select       = document.getElementById("classSelect");
  const filterSelect = document.getElementById("filterClass");
  select.innerHTML = '<option value="">-- Select Class --</option>';
  if (filterSelect) filterSelect.innerHTML = '<option value="">All Classes</option>';
  try {
    const res     = await fetch("/api/schedule/getClassIds");
    const classes = await res.json();
    classes.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.classId;
      option.textContent = `${c.classId}: ${c.className}`;
      select.appendChild(option.cloneNode(true));
      if (filterSelect) filterSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load classes:", err);
  }
}

async function loadInstructorDropdown() {
  const select       = document.getElementById("instructorSelect");
  const filterSelect = document.getElementById("filterInstructor");
  select.innerHTML = '<option value="">-- Select Instructor --</option>';
  if (filterSelect) filterSelect.innerHTML = '<option value="">All Instructors</option>';
  try {
    const res         = await fetch("/api/customer/getInstructors");
    const instructors = await res.json();
    instructors.forEach((i) => {
      const option = document.createElement("option");
      option.value = i.customerId;
      option.textContent = `${i.customerId}: ${i.firstName} ${i.lastName}`;
      select.appendChild(option.cloneNode(true));
      if (filterSelect) filterSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load instructors:", err);
  }
}

// Balance validation on customer select
document.getElementById("customerSelect").addEventListener("change", async () => {
  const customerId = document.getElementById("customerSelect").value;
  const banner     = document.getElementById("validationBanner");
  if (!customerId) { banner.style.display = "none"; return; }

  try {
    const res      = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
    const customer = await res.json();
    banner.style.display = "block";

    const bal = customer.classBalance;

    if (bal <= MIN_BALANCE) {
      banner.className   = "err";
      banner.textContent = `⛔ ${customer.firstName} ${customer.lastName} is at the minimum balance (${MIN_BALANCE}). Cannot check in — please update their package first.`;
    } else if (bal <= 0) {
      banner.className   = "err";
      banner.textContent = `⚠ ${customer.firstName} ${customer.lastName} has ${bal} classes remaining. They can still check in but need a package update soon.`;
    } else if (bal <= 2) {
      banner.className   = "warn";
      banner.textContent = `⚠ ${customer.firstName} ${customer.lastName} has only ${bal} class(es) remaining — consider renewing their package.`;
    } else {
      banner.className   = "ok";
      banner.textContent = `✓ ${customer.firstName} ${customer.lastName} has ${bal} class(es) remaining.`;
    }
  } catch (err) {
    console.error("Failed to validate package:", err);
  }
});

// Save check-in
document.getElementById("saveCheckinBtn").addEventListener("click", async () => {
  const customerId   = document.getElementById("customerSelect").value;
  const classId      = document.getElementById("classSelect").value;
  const instructorId = document.getElementById("instructorSelect").value;
  const datetime     = document.getElementById("checkinDatetime").value;

  if (!customerId || !classId || !instructorId || !datetime) {
    alert("Please fill in all fields before saving.");
    return;
  }

  try {
    const custRes  = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
    const customer = await custRes.json();
    const bal      = customer.classBalance;

    // Block at minimum
    if (bal <= MIN_BALANCE) {
      alert(`⛔ ${customer.firstName} ${customer.lastName} is at the minimum balance (${MIN_BALANCE}). Please update their package before checking in.`);
      return;
    }

    // Warn for zero or negative
    if (bal <= 0) {
      const proceed = confirm(`⚠ WARNING: ${customer.firstName} ${customer.lastName} has ${bal} classes remaining. Their balance will go to ${bal - 1}.\n\nProceed with check-in?`);
      if (!proceed) return;
    }

    const idRes      = await fetch("/api/checkin/getNextId");
    const { nextId } = await idRes.json();

    const saveRes = await fetch("/api/checkin/add", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ checkinId: nextId, customerId, classId, instructorId, checkinDatetime: datetime }),
    });
    const result = await saveRes.json();
    if (!saveRes.ok) throw new Error(result.message || "Failed to save check-in");

    // Always deduct balance
    await fetch(`/api/customer/update?customerId=${customerId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...customer, classBalance: bal - 1 }),
    });

    const newBal = bal - 1;
    let msg = `✅ Check-in ${nextId} saved!`;
    if (newBal < 0) msg += `\n⚠ ${customer.firstName}'s balance is now ${newBal}. Please remind them to purchase a package.`;

    alert(msg);
    clearCheckinForm();
    loadCheckins();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

async function loadCheckins() {
  try {
    const res      = await fetch("/api/checkin/getCheckins");
    const checkins = await res.json();
    window._checkins = checkins;
    renderTable(checkins);
  } catch (err) {
    console.error("Failed to load check-ins:", err);
  }
}

function renderTable(checkins) {
  const search     = document.getElementById("searchInput").value.toLowerCase();
  const instructor = document.getElementById("filterInstructor").value;
  const date       = document.getElementById("filterDate").value;

  const filtered = checkins.filter((c) => {
    const matchSearch     = !search     || c.customerId.toLowerCase().includes(search) || c.classId.toLowerCase().includes(search);
    const matchInstructor = !instructor || c.instructorId === instructor;
    const matchDate       = !date       || c.checkinDatetime.startsWith(date);
    return matchSearch && matchInstructor && matchDate;
  });

  const tbody = document.getElementById("checkinTableBody");
  const empty = document.getElementById("emptyState");
  tbody.innerHTML = "";

  if (filtered.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  filtered.forEach((c) => {
    const dt        = new Date(c.checkinDatetime);
    const formatted = dt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    const tr        = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.customerId}</td>
      <td>${c.classId}</td>
      <td>${c.instructorId}</td>
      <td>${formatted}</td>
      <td>
        <button class="btn btn--danger"
          style="padding:.3rem .7rem; font-size:.8rem;"
          onclick="deleteCheckin('${c.checkinId}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("searchInput").addEventListener("input",       () => renderTable(window._checkins || []));
document.getElementById("filterInstructor").addEventListener("change", () => renderTable(window._checkins || []));
document.getElementById("filterDate").addEventListener("change",       () => renderTable(window._checkins || []));

async function deleteCheckin(checkinId) {
  if (!confirm(`Delete check-in ${checkinId}? This cannot be undone.`)) return;
  try {
    const res = await fetch(`/api/checkin/deleteCheckin?checkinId=${checkinId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    alert(`✅ Check-in ${checkinId} deleted.`);
    loadCheckins();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

function clearCheckinForm() {
  document.getElementById("customerSelect").value   = "";
  document.getElementById("classSelect").value      = "";
  document.getElementById("instructorSelect").value = "";
  const now = new Date(); now.setSeconds(0, 0);
  document.getElementById("checkinDatetime").value  = now.toISOString().slice(0, 16);
  const banner = document.getElementById("validationBanner");
  banner.style.display = "none";
  banner.className = "";
}
