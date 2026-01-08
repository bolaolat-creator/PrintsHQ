// 1. FULL DATA CAPTURE
const inventory = [
  { name: "R23mm", size: "23mm", quantity: 23, cost: 6000 },
  { name: "Round 40/42mm", size: "40/42mm", quantity: 89, cost: 6500 },
  { name: "Oval 52x37mm", size: "52x37mm", quantity: 27, cost: 6500 },
  { name: "Rectangle 15x80mm", size: "15x80mm", quantity: 20, cost: 6000 },
  { name: "Rectangle 22x78mm", size: "22x78mm", quantity: 5, cost: 6500 },
  { name: "Rectangle 33x63mm", size: "33x63mm", quantity: 24, cost: 6500 },
  { name: "Rectangle 80x100mm", size: "80x100mm", quantity: 49, cost: 15000 },
  { name: "Rectangle 60x90mm", size: "60x90mm", quantity: 12, cost: 12000 },
  { name: "Manual Paid/Received Stamp 20x50mm", size: "20x50mm", quantity: 18, cost: 9000 },
  { name: "Wax Stamp", size: "Wax", quantity: 49, cost: 9000 },
  { name: "Fabric Ink", size: "10ml", quantity: 50, cost: 5000 },
  { name: "Nylon Ink", size: "10ml", quantity: 50, cost: 5000 },
  { name: "Paper Ink", size: "10ml", quantity: 50, cost: 3000 }
];

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxnFPhnMtZ2iJIQfnzBWdwTqHVTqiLmbLnSHe_F9ws3zf8e6C8-f6eYt4FaXs3wbw/exec";
let sales = JSON.parse(localStorage.getItem("sales")) || [];
const LOW_STOCK_LEVEL = 5;

// UI Elements
const category = document.getElementById("category");
const stampSection = document.getElementById("stampSection");
const otherSection = document.getElementById("otherSection");
const stampType = document.getElementById("stampType");

// 2. INITIALIZE PAGE
function init() {
  stampType.innerHTML = ""; // Clear existing
  inventory.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} (${item.size})`;
    stampType.appendChild(option);
  });

  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("time").value = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

  loadInventory();
  updateDashboard();
}

// 3. CATEGORY SWITCHING
category.addEventListener("change", () => {
  stampSection.style.display = category.value === "Stamp" ? "block" : "none";
  otherSection.style.display = category.value === "Other" ? "block" : "none";
});

// 4. SAVE SALE & SYNC
document.getElementById("salesForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const priceCharged = Number(document.getElementById("priceCharged").value);
  let productCost = Number(document.getElementById("productCost").value);
  let productName = document.getElementById("productName").value;
  let qty = Number(document.getElementById("quantity").value) || 1;

  if (category.value === "Stamp") {
    const selected = inventory.find(i => i.name === stampType.value);
    productCost = selected.cost;
    productName = selected.name;
    qty = 1;
    if (selected.quantity > 0) selected.quantity -= 1;
  }

  const record = {
    client: document.getElementById("client").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    category: category.value,
    product: productName,
    quantity: qty,
    priceCharged: priceCharged,
    productCost: productCost,
    profit: priceCharged - productCost
  };

  sales.push(record);
  localStorage.setItem("sales", JSON.stringify(sales));
  
  updateDashboard();
  loadInventory();

  // Sync to Google
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors", 
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.log("Cloud sync delayed.");
  }

  e.target.reset();
  init(); // Refresh defaults
});

// 5. HELPER FUNCTIONS
function loadInventory() {
  const list = document.getElementById("inventoryList");
  list.innerHTML = "";
  inventory.forEach(item => {
    const li = document.createElement("li");
    const isLow = item.quantity <= LOW_STOCK_LEVEL;
    li.innerHTML = `
      <span><strong>${item.name}</strong> <small>(${item.size})</small></span>
      <span class="${isLow ? 'low-stock-alert' : ''}">Stock: ${item.quantity} ${isLow ? '⚠' : ''}</span>
    `;
    list.appendChild(li);
  });
}

function updateDashboard(data = sales) {
  let s = 0, p = 0;
  data.forEach(sale => { s += sale.priceCharged; p += sale.profit; });
  document.getElementById("totalSales").textContent = s.toLocaleString();
  document.getElementById("totalProfit").textContent = p.toLocaleString();
  document.getElementById("totalOrders").textContent = data.length;
}

// ... (Rest of filtering/printing functions stay the same)

init();
