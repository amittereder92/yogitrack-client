let formMode = "search";

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initCustomerDropdown();
  addCustomerDropdownListener();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", () => {
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

  const seniorVal = form.senior.value === "true";
  const prefContact = document.querySelector('input[name="preferredContact"]:checked')?.value || "phone";

  if (formMode === "add") {
    const res = await fetch("/api/customer/getNextId");
    const { nextId } = await res.json();

    const customerData = {
      customerId: nextId,
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      address: form.address.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      classBalance: parseInt(form.classBalance.value) || 0,
      senior: seniorVal,
      preferredContact: prefContact,
    };

    try {
      const saveRes = await fetch("/api/customer/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      const result = await saveRes.json();
      if (!saveRes.ok) throw new Error(result.message || "Failed to add customer");
      alert(`✅ Customer ${customerData.customerId} added successfully!`);
      clearCustomerForm();
      setFormForSearch();
      initCustomerDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }

  } else if (formMode === "edit") {
    const customerId = document.getElementById("customerIdText").value;
    const customerData = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      address: form.address.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      classBalance: parseInt(form.classBalance.value) || 0,
      senior: seniorVal,
      preferredContact: prefContact,
    };

    try {
      const updateRes = await fetch(`/api/customer/update?customerId=${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      const result = await updateRes.json();
      if (!updateRes.ok) throw new Error(result.message || "Failed to update customer");
      alert(`✅ Customer ${customerId} updated successfully!`);
      clearCustomerForm();
      setFormForSearch();
      initCustomerDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const customerId = document.getElementById("customerIdSelect").value;
  if (!customerId) { alert("Please select a customer to delete."); return; }
  if (!confirm(`Delete customer ${customerId}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/customer/deleteCustomer?customerId=${customerId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Customer delete failed");
    alert(`✅ Customer ${customerId} deleted.`);
    clearCustomerForm();
    setFormForSearch();
    initCustomerDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

async function initCustomerDropdown() {
  const select = document.getElementById("customerIdSelect");
  select.innerHTML = '<option value=""> -- Select Customer -- </option>';
  try {
    const res = await fetch("/api/customer/getCustomerIds");
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
  const form = document.getElementById("customerForm");
  const select = document.getElementById("customerIdSelect");

  select.addEventListener("change", async () => {
    const customerId = select.value;
    if (!customerId) return;

    try {
      const res = await fetch(`/api/customer/getCustomer?customerId=${customerId}`);
      if (!res.ok) throw new Error("Customer search failed");
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) { alert("No customer found"); return; }

      form.firstName.value = data.firstName || "";
      form.lastName.value = data.lastName || "";
      form.address.value = data.address || "";
      form.phone.value = data.phone || "";
      form.email.value = data.email || "";
      form.classBalance.value = data.classBalance ?? 0;

      // Senior radio
      const seniorRadios = form.querySelectorAll('input[name="senior"]');
      seniorRadios.forEach(r => r.checked = (r.value === String(data.senior)));

      // Preferred contact radio
      const prefRadios = form.querySelectorAll('input[name="preferredContact"]');
      prefRadios.forEach(r => r.checked = (r.value === data.preferredContact));

      formMode = "edit";
      document.getElementById("customerIdText").value = customerId;
    } catch (err) {
      alert(`Error loading customer: ${err.message}`);
    }
  });
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset();
  document.getElementById("customerIdSelect").innerHTML = '<option value=""> -- Select Customer -- </option>';
  document.getElementById("customerIdText").value = "";
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("customerIdLabel").style.display = "block";
  document.getElementById("customerIdTextLabel").style.display = "none";
  document.getElementById("customerIdText").style.display = "none";
  document.getElementById("customerIdText").value = "";
  document.getElementById("customerForm").reset();
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("customerIdLabel").style.display = "none";
  document.getElementById("customerIdTextLabel").style.display = "block";
  document.getElementById("customerIdText").removeAttribute("hidden");
  document.getElementById("customerIdText").style.display = "block";
  document.getElementById("customerIdText").value = "Auto-generated";
  document.getElementById("customerForm").reset();
}
