// 1. DATA SETUP
const inventory = [
  { name: "R23mm", size: "23mm", quantity: 23, cost: 6000 },
  { name: "Round 40/42mm", size: "40/42mm", quantity: 89, cost: 6500 },
  { name: "Oval 52x37mm", size: "52x37mm", quantity: 27, cost: 6500 },
  { name: "Rectangle 15x80mm", size: "15x80mm", quantity: 20, cost: 6000 }
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
  inventory.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
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

// 4. SAVE SALE & SYNC TO GOOGLE
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

  // Save Locally
  sales.push(record);
  localStorage.setItem("sales", JSON.stringify(sales));
  
  // Update UI
  updateDashboard();
  loadInventory();

  // Send to Google Sheets
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    console.log("Synced with Google Sheets");
  } catch (err) {
    console.error("Cloud sync failed, saved locally only.", err);
  }

  // Reset Form
  e.target.reset();
  document.getElementById("date").valueAsDate = new Date();
});

// 5. DASHBOARD & INVENTORY HELPERS
function updateDashboard(data = sales) {
  let totalSales = 0, totalProfit = 0;
  data.forEach(sale => {
    totalSales += sale.priceCharged;
    totalProfit += sale.profit;
  });
  document.getElementById("totalSales").textContent = totalSales.toLocaleString();
  document.getElementById("totalProfit").textContent = totalProfit.toLocaleString();
  document.getElementById("totalOrders").textContent = data.length;
}

function loadInventory() {
  const list = document.getElementById("inventoryList");
  list.innerHTML = "";
  inventory.forEach(item => {
    const li = document.createElement("li");
    const isLow = item.quantity <= LOW_STOCK_LEVEL;
    li.innerHTML = `
      <span>${item.name}</span>
      <span class="${isLow ? 'low-stock-alert' : ''}">Qty: ${item.quantity} ${isLow ? '⚠' : ''}</span>
    `;
    list.appendChild(li);
  });
}

// 6. EXTRA FEATURES (Monthly & Print)
function filterByDate() {
  const d = document.getElementById("filterDate").value;
  updateDashboard(sales.filter(s => s.date === d));
}

function clearFilter() { updateDashboard(); }

function monthlySummary() {
  const m = document.getElementById("monthPicker").value;
  const filtered = sales.filter(s => s.date.startsWith(m));
  let s = 0, p = 0;
  filtered.forEach(f => { s += f.priceCharged; p += f.profit; });
  document.getElementById("monthlySales").textContent = s.toLocaleString();
  document.getElementById("monthlyProfit").textContent = p.toLocaleString();
  document.getElementById("monthlyOrders").textContent = filtered.length;
}

function printDailyReport() {
  const date = document.getElementById("printDate").value;
  const filtered = sales.filter(s => s.date === date);
  let rows = filtered.map(s => `<tr><td>${s.client}</td><td>${s.product}</td><td>₦${s.priceCharged}</td><td>₦${s.profit}</td></tr>`).join("");
  const win = window.open("", "_blank");
  win.document.write(`<h2>Report: ${date}</h2><table border="1" width="100%">${rows}</table>`);
  win.print();
}

init();
