let formMode = "search";

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initCustomerDropdown();
  addCustomerDropdownListener();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
  clearCustomerForm();
  setFormForSearch();
  initCustomerDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", () => {
  setFormForAdd();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  const form = document.getElementById("customerForm");

  if (formMode === "add") {
    const res = await fetch("/api/customer/getNextId");
    const { nextId } = await res.json();

    // Prompt for password
    const password = prompt("Set a password for this customer's portal login:");
    if (!password) { alert("Password is required."); return; }
    if (password.length < 6) { alert("Password must be at least 6 characters."); return; }

    const senior = form.querySelector('input[name="senior"]:checked');
    const pref   = form.querySelector('input[name="preferredContact"]:checked');

    const customerData = {
      customerId:       nextId,
      firstName:        form.firstName.value.trim(),
      lastName:         form.lastName.value.trim(),
      email:            form.email.value.trim(),
      phone:            form.phone.value.trim(),
      address:          form.address.value.trim(),
      senior:           senior ? senior.value === "true" : false,
      preferredContact: pref ? pref.value : "email",
      classBalance:     parseInt(form.classBalance.value) || 0,
      password,
    };

    if (!customerData.firstName || !customerData.lastName) {
      alert("First and last name are required.");
      return;
    }

    try {
      const res = await fetch("/api/customer/add", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(customerData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add customer");
      alert(`✅ Customer ${nextId} added successfully! They can log in with their email and the password you set.`);
      clearCustomerForm();
      setFormForSearch();
      initCustomerDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }

  } else if (formMode === "search") {
    const select     = document.getElementById("customerIdSelect");
    const customerId = select.value;
    if (!customerId) { alert("Please select a customer to update."); return; }

    const senior = document.getElementById("customerForm").querySelector('input[name="senior"]:checked');
    const pref   = document.getElementById("customerForm").querySelector('input[name="preferredContact"]:checked');

    const customerData = {
      firstName:        document.getElementById("firstName").value.trim(),
      lastName:         document.getElementById("lastName").value.trim(),
      email:            document.getElementById("email").value.trim(),
      phone:            document.getElementById("phone").value.trim(),
      address:          document.getElementById("address").value.trim(),
      senior:           senior ? senior.value === "true" : false,
      preferredContact: pref ? pref.value : "email",
      classBalance:     parseInt(document.getElementById("classBalance").value) || 0,
    };

    try {
      const res = await fetch(`/api/customer/update?customerId=${customerId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(customerData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update customer");
      alert(`✅ Customer ${customerId} updated successfully!`);
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const select     = document.getElementById("customerIdSelect");
  const customerId = select.value;
  if (!customerId) { alert("Please select a customer to delete."); return; }
  if (!confirm(`Delete customer ${customerId}?`)) return;

  try {
    const res = await fetch(`/api/customer/deleteCustomer?customerId=${customerId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    alert(`✅ Customer ${customerId} deleted.`);
    clearCustomerForm();
    initCustomerDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

async function initCustomerDropdown() {
  const select = document.getElementById("customerIdSelect");
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
    console.error("Failed to load customer IDs:", err);
  }
}

async function addCustomerDropdownListener() {
  const form   = document.getElementById("customerForm");
  const select = document.getElementById("customerIdSelect");

  select.addEventListener("change", async () => {
    const customerId = select.value;
    if (!customerId) return;

    try {
      const res = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
      if (!res.ok) throw new Error("Customer search failed");
      const data = await res.json();
      if (!data) { alert("No customer found"); return; }

      document.getElementById("firstName").value    = data.firstName    || "";
      document.getElementById("lastName").value     = data.lastName     || "";
      document.getElementById("email").value        = data.email        || "";
      document.getElementById("phone").value        = data.phone        || "";
      document.getElementById("address").value      = data.address      || "";
      document.getElementById("classBalance").value = data.classBalance || 0;

      const seniorRadios = form.querySelectorAll('input[name="senior"]');
      seniorRadios.forEach(r => { r.checked = r.value === String(data.senior); });

      const prefRadios = form.querySelectorAll('input[name="preferredContact"]');
      prefRadios.forEach(r => { r.checked = r.value === data.preferredContact; });

    } catch (err) {
      alert(`Error loading customer: ${err.message}`);
    }
  });
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset();
  document.getElementById("customerIdSelect").innerHTML = '<option value="">-- Select Customer --</option>';
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("customerIdLabel").style.display     = "block";
  document.getElementById("customerIdTextLabel").style.display = "none";
  document.getElementById("customerIdText").style.display      = "none";
  document.getElementById("customerIdText").value              = "";
  document.getElementById("addBtn").disabled = false;
  document.getElementById("customerForm").reset();
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("customerIdLabel").style.display     = "none";
  document.getElementById("customerIdTextLabel").style.display = "block";
  document.getElementById("customerIdText").value              = "";
  document.getElementById("addBtn").disabled = true;
  document.getElementById("customerForm").reset();
}
