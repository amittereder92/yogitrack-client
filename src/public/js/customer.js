let formMode = "search";
let allPackages = [];

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initCustomerDropdown();
  addCustomerDropdownListener();
  loadPackages();

  // Instructor search button
  const instrSearch = document.getElementById("instrSearchBtn");
  if (instrSearch) {
    instrSearch.addEventListener("click", () => {
      clearCustomerForm();
      setFormForSearch();
      initCustomerDropdown();
    });
  }
});

document.getElementById("searchBtn")?.addEventListener("click", async () => {
  clearCustomerForm();
  setFormForSearch();
  initCustomerDropdown();
});

document.getElementById("addBtn")?.addEventListener("click", () => {
  setFormForAdd();
});

document.getElementById("saveBtn")?.addEventListener("click", async () => {
  const form = document.getElementById("customerForm");

  if (formMode === "add") {
    const res = await fetch("/api/customer/getNextId");
    const { nextId } = await res.json();

    const password = prompt("Set a portal login password for this customer:");
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
      role:             document.getElementById("portalRole").value,
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
      alert(`✅ Customer ${nextId} added successfully!`);
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
      role:             document.getElementById("portalRole")?.value || "customer",
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

document.getElementById("deleteBtn")?.addEventListener("click", async () => {
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
    if (!customerId) {
      document.getElementById("packageSaleSection").style.display = "none";
      return;
    }

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

      try {
        const userRes  = await fetch(`/api/customer/getRole?customerId=${customerId}`);
        const userData = await userRes.json();
        if (userData.role && document.getElementById("portalRole")) {
          document.getElementById("portalRole").value = userData.role;
        }
      } catch (e) {
        if (document.getElementById("portalRole"))
          document.getElementById("portalRole").value = "customer";
      }

      // Show package sale section
      document.getElementById("packageSaleSection").style.display = "block";
      document.getElementById("saleCustomerName").textContent =
        `Selling to: ${data.firstName} ${data.lastName} — Current balance: ${data.classBalance || 0} classes`;
      clearSaleForm();
      loadSaleHistory(customerId);

    } catch (err) {
      alert(`Error loading customer: ${err.message}`);
    }
  });
}

// Load all packages into the sale dropdown
async function loadPackages() {
  try {
    const res  = await fetch("/api/package/getPackageIds");
    allPackages = await res.json();
    const sel  = document.getElementById("salePackageSelect");
    allPackages.forEach(p => {
      const o = document.createElement("option");
      o.value = p.packageId;
      o.textContent = `${p.packageName}${p.price ? ` — $${p.price}` : ""}`;
      o.dataset.classes = p.classCount || 0;
      o.dataset.price   = p.price || 0;
      sel.appendChild(o);
    });
  } catch (err) {
    console.error("Failed to load packages:", err);
  }
}

// Auto-fill classes and price when package is selected
function onPackageSelected() {
  const sel = document.getElementById("salePackageSelect");
  const opt = sel.options[sel.selectedIndex];
  if (!opt.value) return;

  const classCount = document.getElementById("saleClassesCount");
  const amountPaid = document.getElementById("saleAmountPaid");
  if (classCount) classCount.value = opt.dataset.classes || "";
  if (amountPaid) amountPaid.value = opt.dataset.price   || "";
}

// Sell package
async function sellPackage() {
  const customerId    = document.getElementById("customerIdSelect").value;
  const packageId     = document.getElementById("salePackageSelect").value;
  const classesCount  = document.getElementById("saleClassesCount")?.value;
  const amountPaid    = document.getElementById("saleAmountPaid")?.value;
  const paymentMethod = document.getElementById("salePaymentMethod")?.value || "cash";
  const feedback      = document.getElementById("saleFeedback");

  if (!customerId) { showSaleFeedback("Please select a customer first.", false); return; }
  if (!packageId)  { showSaleFeedback("Please select a package.", false); return; }

  try {
    const res  = await fetch("/api/sales/sell", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        customerId,
        packageId,
        classesAdded:  classesCount,
        amountPaid:    amountPaid,
        paymentMethod,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showSaleFeedback(data.error || "Sale failed.", false);
      return;
    }

    showSaleFeedback(`✅ Sale recorded! New balance: ${data.newBalance} classes.`, true);
    document.getElementById("classBalance").value = data.newBalance;
    document.getElementById("saleCustomerName").textContent =
      `Selling to: ${document.getElementById("firstName").value} ${document.getElementById("lastName").value} — Current balance: ${data.newBalance} classes`;
    clearSaleForm();
    loadSaleHistory(customerId);

  } catch (err) {
    showSaleFeedback("Could not connect. Please try again.", false);
  }
}

function showSaleFeedback(msg, success) {
  const el = document.getElementById("saleFeedback");
  el.textContent = msg;
  el.style.display = "block";
  el.style.background = success ? "#e4ede0" : "#f8e8e8";
  el.style.color      = success ? "#3d6b2e" : "#842029";
  el.style.border     = success ? "1px solid #b2d4a8" : "1px solid #f1aeb5";
}

async function loadSaleHistory(customerId) {
  try {
    const res   = await fetch(`/api/sales/history?customerId=${customerId}`);
    const sales = await res.json();
    const tbody = document.getElementById("saleHistoryBody");
    const empty = document.getElementById("saleHistoryEmpty");
    tbody.innerHTML = "";

    if (!sales.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    sales.forEach(s => {
      const dt = new Date(s.saleDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dt}</td>
        <td>${s.packageName}</td>
        <td>${s.classesAdded}</td>
        <td>$${parseFloat(s.amountPaid).toFixed(2)}</td>
        <td>${s.paymentMethod}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load sale history:", err);
  }
}

function clearSaleForm() {
  document.getElementById("salePackageSelect").value = "";
  const classesCount = document.getElementById("saleClassesCount");
  const amountPaid   = document.getElementById("saleAmountPaid");
  if (classesCount) classesCount.value = "";
  if (amountPaid)   amountPaid.value   = "";
  document.getElementById("saleFeedback").style.display = "none";
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset();
  document.getElementById("customerIdSelect").innerHTML = '<option value="">-- Select Customer --</option>';
  if (document.getElementById("portalRole"))
    document.getElementById("portalRole").value = "customer";
  document.getElementById("packageSaleSection").style.display = "none";
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("customerIdLabel").style.display     = "block";
  document.getElementById("customerIdTextLabel").style.display = "none";
  document.getElementById("customerIdText").style.display      = "none";
  document.getElementById("customerIdText").value              = "";
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = false;
  document.getElementById("customerForm").reset();
  if (document.getElementById("portalRole"))
    document.getElementById("portalRole").value = "customer";
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("customerIdLabel").style.display     = "none";
  document.getElementById("customerIdTextLabel").style.display = "block";
  document.getElementById("customerIdText").value              = "";
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = true;
  document.getElementById("customerForm").reset();
  if (document.getElementById("portalRole"))
    document.getElementById("portalRole").value = "customer";
  document.getElementById("packageSaleSection").style.display = "none";
}
