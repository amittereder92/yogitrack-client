document.addEventListener("DOMContentLoaded", () => {
  loadInstructorDropdown();
  addDropdownListener();
});

async function loadInstructorDropdown() {
  const select = document.getElementById("instructorIdSelect");
  select.innerHTML = '<option value="">-- Select Instructor --</option>';
  try {
    // Get all customers with instructor role
    const res       = await fetch("/api/customer/getInstructors");
    const instructors = await res.json();
    instructors.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.customerId;
      option.textContent = `${c.customerId}: ${c.firstName} ${c.lastName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load instructors:", err);
  }
}

async function addDropdownListener() {
  const select = document.getElementById("instructorIdSelect");
  select.addEventListener("change", async () => {
    const customerId = select.value;
    if (!customerId) { clearForm(); return; }

    try {
      const res  = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
      const data = await res.json();
      if (!data) { alert("No customer found"); return; }

      document.getElementById("firstName").value = data.firstName || "";
      document.getElementById("lastName").value  = data.lastName  || "";
      document.getElementById("email").value     = data.email     || "";
      document.getElementById("phone").value     = data.phone     || "";
      document.getElementById("address").value   = data.address   || "";

      const prefRadios = document.querySelectorAll('input[name="pref"]');
      prefRadios.forEach(r => { r.checked = r.value === data.preferredContact; });

    } catch (err) {
      alert(`Error loading instructor: ${err.message}`);
    }
  });
}

// SAVE — update phone, address, preferred contact
document.getElementById("saveBtn").addEventListener("click", async () => {
  const customerId = document.getElementById("instructorIdSelect").value;
  if (!customerId) { alert("Please select an instructor."); return; }

  const pref = document.querySelector('input[name="pref"]:checked');
  const body = {
    phone:            document.getElementById("phone").value.trim(),
    address:          document.getElementById("address").value.trim(),
    preferredContact: pref ? pref.value : "email",
  };

  try {
    // Get full customer data first to avoid overwriting fields
    const getRes  = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
    const current = await getRes.json();

    const res = await fetch(`/api/customer/update?customerId=${customerId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...current, ...body }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to update");
    alert(`✅ Instructor updated successfully!`);
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// REMOVE INSTRUCTOR ROLE — demote back to customer
document.getElementById("removeRoleBtn").addEventListener("click", async () => {
  const customerId = document.getElementById("instructorIdSelect").value;
  if (!customerId) { alert("Please select an instructor."); return; }

  const name = `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`;
  if (!confirm(`Remove instructor role from ${name}? They will become a regular customer.`)) return;

  try {
    const getRes  = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
    const current = await getRes.json();

    const res = await fetch(`/api/customer/update?customerId=${customerId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...current, role: "customer" }),
    });
    if (!res.ok) throw new Error("Failed to update role");
    alert(`✅ ${name} has been changed back to a customer.`);
    clearForm();
    loadInstructorDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

function clearForm() {
  document.getElementById("instructorIdSelect").value = "";
  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value  = "";
  document.getElementById("email").value     = "";
  document.getElementById("phone").value     = "";
  document.getElementById("address").value   = "";
  document.querySelectorAll('input[name="pref"]').forEach(r => r.checked = false);
}
