// 1. DATA SETUP
const inventory = [
  { name: "R23mm", size: "23mm", quantity: 23, cost: 6000 },
  { name: "Round 40/42mm", size: "40/42mm", quantity: 89, cost: 6500 },
  { name: "Oval 52x37mm", size: "52x37mm", quantity: 27, cost: 6500 },
  { name: "Rectangle 15x80mm", size: "15x80mm", quantity: 20, cost: 6000 }
];

let sales = JSON.parse(localStorage.getItem("sales")) || [];
const LOW_STOCK_LEVEL = 5;

// 2. INITIALIZE PAGE
const category = document.getElementById("category");
const stampSection = document.getElementById("stampSection");
const otherSection = document.getElementById("otherSection");
const stampType = document.getElementById("stampType");

// Populate Stamp Dropdown
inventory.forEach(item => {
  const option = document.createElement("option");
  option.value = item.name;
  option.textContent = item.name;
  stampType.appendChild(option);
});

// Set default date/time
document.getElementById("date").valueAsDate = new Date();
document.getElementById("time").value = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

// 3. EVENT LISTENERS
category.addEventListener("change", () => {
  stampSection.style.display = category.value === "Stamp" ? "block" : "none";
  otherSection.style.display = category.value === "Other" ? "block" : "none";
});

document.getElementById("salesForm").addEventListener("submit", e => {
  e.preventDefault();

  const priceCharged = Number(document.getElementById("priceCharged").value);
  let productCost = Number(document.getElementById("productCost").value);
  
  // Logic for Stamps: Auto-cost and Inventory Reduce
  let productName = document.getElementById("productName").value;
  let qty = Number(document.getElementById("quantity").value) || 1;

  if (category.value === "Stamp") {
    const selected = inventory.find(i => i.name === stampType.value);
    productCost = selected.cost;
    productName = selected.name;
    qty = 1; // Standard for stamps
    if (selected.quantity > 0) selected.quantity -= 1;
  }

  const record = {
    client: document.getElementById("client").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    category: category.value,
    product: productName,
    quantity: qty,
    priceCharged,
    productCost,
    profit: priceCharged - productCost
  };

  sales.push(record);
  localStorage.setItem("sales", JSON.stringify(sales));
  
  updateDashboard();
  loadInventory();
  dailyAutoBackup(); // Checks and triggers backup
  e.target.reset();
  document.getElementById("date").valueAsDate = new Date();
});

// 4. CORE FUNCTIONS
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
      <span>${item.name} (${item.size})</span>
      <span class="${isLow ? 'low-stock-alert' : ''}">Qty: ${item.quantity} ${isLow ? '⚠' : ''}</span>
    `;
    list.appendChild(li);
  });
}

// 5. BACKUP & EXPORT
function dailyAutoBackup() {
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem("lastBackupDate") === today) return;

  exportToExcel(`backup_${today}.csv`);
  localStorage.setItem("lastBackupDate", today);
}

function exportToExcel(fileName = "sales_report.csv") {
  let csv = "Client,Date,Time,Category,Product,Quantity,Price,Cost,Profit\n";
  sales.forEach(s => {
    csv += `${s.client},${s.date},${s.time},${s.category},${s.product},${s.quantity},${s.priceCharged},${s.productCost},${s.profit}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
}

// 6. FILTERING & REPORTS
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
  win.document.write(`
    <h2>Report for ${date}</h2>
    <table border="1" width="100%" style="border-collapse:collapse">
      <thead><tr><th>Client</th><th>Product</th><th>Price</th><th>Profit</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
  win.print();
}

// Init
loadInventory();
updateDashboard();
