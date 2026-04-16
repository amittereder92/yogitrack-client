let formMode = "search";

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initPackageDropdown();
  addPackageDropdownListener();
});

document.getElementById("searchBtn").addEventListener("click", () => {
  clearPackageForm();
  setFormForSearch();
  initPackageDropdown();
});

document.getElementById("addBtn").addEventListener("click", () => {
  setFormForAdd();
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const form = document.getElementById("packageForm");

  if (formMode === "add") {
    const res = await fetch("/api/package/getNextId");
    const { nextId } = await res.json();

    const packageData = {
      packageId:   nextId,
      packageName: form.packageName.value.trim(),
      description: form.description.value.trim(),
      price:       parseFloat(form.price.value) || 0,
      classCount:  parseInt(form.classCount.value) || 0,
    };

    try {
      const saveRes = await fetch("/api/package/add", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(packageData),
      });
      const result = await saveRes.json();
      if (!saveRes.ok) throw new Error(result.message || "Failed to add package");
      alert(`✅ Package ${packageData.packageId} added successfully!`);
      clearPackageForm();
      setFormForSearch();
      initPackageDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }

  } else if (formMode === "edit") {
    const packageId = document.getElementById("packageIdText").value;
    const packageData = {
      packageName: form.packageName.value.trim(),
      description: form.description.value.trim(),
      price:       parseFloat(form.price.value) || 0,
      classCount:  parseInt(form.classCount.value) || 0,
    };

    try {
      const updateRes = await fetch(`/api/package/update?packageId=${packageId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(packageData),
      });
      const result = await updateRes.json();
      if (!updateRes.ok) throw new Error(result.message || "Failed to update package");
      alert(`✅ Package ${packageId} updated successfully!`);
      clearPackageForm();
      setFormForSearch();
      initPackageDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
  const select    = document.getElementById("packageIdSelect");
  const packageId = select.value;
  if (!packageId) { alert("Please select a package to delete."); return; }
  if (!confirm(`Delete package ${packageId}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/package/deletePackage?packageId=${packageId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Package delete failed");
    alert(`✅ Package ${packageId} deleted.`);
    clearPackageForm();
    setFormForSearch();
    initPackageDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

async function initPackageDropdown() {
  const select = document.getElementById("packageIdSelect");
  select.innerHTML = '<option value=""> -- Select Package -- </option>';
  try {
    const res      = await fetch("/api/package/getPackageIds");
    const packages = await res.json();
    packages.forEach((pkg) => {
      const option = document.createElement("option");
      option.value = pkg.packageId;
      option.textContent = `${pkg.packageId}: ${pkg.packageName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load package IDs:", err);
  }
}

async function addPackageDropdownListener() {
  const form   = document.getElementById("packageForm");
  const select = document.getElementById("packageIdSelect");

  select.addEventListener("change", async () => {
    const packageId = select.value;
    if (!packageId) return;

    try {
      const res  = await fetch(`/api/package/getPackage?packageId=${packageId}`);
      if (!res.ok) throw new Error("Package search failed");
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) { alert("No package found"); return; }

      form.packageName.value = data.packageName || "";
      form.description.value = data.description || "";
      form.price.value       = data.price       || "";
      form.classCount.value  = data.classCount  || "";

      formMode = "edit";
      document.getElementById("packageIdText").value = packageId;
    } catch (err) {
      alert(`Error loading package: ${err.message}`);
    }
  });
}

function clearPackageForm() {
  document.getElementById("packageForm").reset();
  document.getElementById("packageIdSelect").innerHTML = '<option value=""> -- Select Package -- </option>';
  document.getElementById("packageIdText").value = "";
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("packageIdLabel").style.display     = "block";
  document.getElementById("packageIdTextLabel").style.display = "none";
  document.getElementById("packageIdText").style.display      = "none";
  document.getElementById("packageIdText").value              = "";
  document.getElementById("packageForm").reset();
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("packageIdLabel").style.display     = "none";
  document.getElementById("packageIdTextLabel").style.display = "block";
  document.getElementById("packageIdText").removeAttribute("hidden");
  document.getElementById("packageIdText").style.display      = "block";
  document.getElementById("packageIdText").value              = "Auto-generated";
  document.getElementById("packageForm").reset();
}
