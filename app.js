// 1. EXACT INVENTORY DATA (FROM YOUR LIST)
const inventory = [
  { name: "R23mm", size: "23mm", quantity: 23, cost: 2000 },
  { name: "Round 40/42mm", size: "40/42mm", quantity: 89, cost: 2000 },
  { name: "Oval 52x37mm", size: "52x37mm", quantity: 27, cost: 2000 },
  { name: "Rectangle 15x80mm", size: "15x80mm", quantity: 20, cost: 2000 },
  { name: "Rectangle 22x78mm", size: "22x78mm", quantity: 5, cost: 2000 },
  { name: "Rectangle 33x63mm", size: "33x63mm", quantity: 24, cost: 2000 },
  { name: "Rectangle 80x100mm", size: "80x100mm", quantity: 49, cost: 3000 },
  { name: "Rectangle 60x90mm", size: "60x90mm", quantity: 12, cost: 3000 },
  { name: "Manual Paid/Received Stamp 20x50mm", size: "20x50mm", quantity: 18, cost: 1200 },
  { name: "Wax Stamp", size: "Wax", quantity: 49, cost: 2500 },
  { name: "Fabric Ink", size: "10ml", quantity: 50, cost: 500 },
  { name: "Nylon Ink", size: "10ml", quantity: 50, cost: 500 },
  { name: "Paper Ink", size: "10ml", quantity: 50, cost: 500 }
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
  stampType.innerHTML = '<option value="">-- Select Product --</option>'; 
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
  if (category.value === "Stamp") {
    stampSection.style.display = "block";
    otherSection.style.display = "none";
  } else if (category.value === "Other") {
    stampSection.style.display = "none";
    otherSection.style.display = "block";
  } else {
    stampSection.style.display = "none";
    otherSection.style.display = "none";
  }
});

// 4. SAVE SALE & SYNC TO GOOGLE
document.getElementById("salesForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const priceCharged = Number(document.getElementById("priceCharged").value);
  const qtySold = Number(document.getElementById("quantitySold").value);
  let unitCost = 0;
  let productName = "";

  if (category.value === "Stamp") {
    const selected = inventory.find(i => i.name === stampType.value);
    if(!selected) return alert("Select an item");
    
    unitCost = selected.cost;
    productName = selected.name;
    selected.quantity -= qtySold; // Reduces stock by the amount sold
  } else {
    productName = document.getElementById("productName").value;
    unitCost = Number(document.getElementById("productCost").value);
  }

  // CALCULATIONS
  const totalCost = unitCost * qtySold;
  const totalProfit = priceCharged - totalCost;

  const record = {
    client: document.getElementById("client").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    category: category.value,
    product: productName,
    quantity: qtySold,       // Sending the actual quantity
    priceCharged: priceCharged, 
    productCost: totalCost,  // Sending the multiplied cost
    profit: totalProfit      // Sending the correct profit
  };

  // Save locally
  sales.push(record);
  localStorage.setItem("sales", JSON.stringify(sales));
  localStorage.setItem("currentInventory", JSON.stringify(inventory));
  
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
    console.log("Cloud sync error"); 
  }

  e.target.reset();
  init(); 
});

// 5. DASHBOARD & FILTERING
function updateDashboard(data = sales) {
  let s = 0, p = 0;
  data.forEach(sale => { s += sale.priceCharged; p += sale.profit; });
  document.getElementById("totalSales").textContent = s.toLocaleString();
  document.getElementById("totalProfit").textContent = p.toLocaleString();
  document.getElementById("totalOrders").textContent = data.length;
}

function filterByDate() {
  const d = document.getElementById("filterDate").value;
  if (!d) return;
  const filtered = sales.filter(s => s.date === d);
  updateDashboard(filtered);
}

function clearFilter() {
  updateDashboard(sales);
}

// 6. MONTHLY SUMMARY LOGIC
function monthlySummary() {
  const month = document.getElementById("monthPicker").value;
  if (!month) return alert("Please select a month");
  
  const filtered = sales.filter(s => s.date.startsWith(month));
  let mSales = 0, mProfit = 0;
  
  filtered.forEach(f => { 
    mSales += f.priceCharged; 
    mProfit += f.profit; 
  });
  
  document.getElementById("monthlySales").textContent = mSales.toLocaleString();
  document.getElementById("monthlyProfit").textContent = mProfit.toLocaleString();
}

// 7. PRINTABLE PDF LOGIC
function printDailyReport() {
  const date = document.getElementById("printDate").value;
  if (!date) return alert("Select a date to print");
  
  const filtered = sales.filter(s => s.date === date);
  if (filtered.length === 0) return alert("No sales found for this date");

  let rows = filtered.map(s => `
    <tr>
      <td style="padding:8px; border:1px solid #ddd;">${s.client}</td>
      <td style="padding:8px; border:1px solid #ddd;">${s.product}</td>
      <td style="padding:8px; border:1px solid #ddd;">₦${s.priceCharged.toLocaleString()}</td>
      <td style="padding:8px; border:1px solid #ddd;">₦${s.profit.toLocaleString()}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head><title>Report - ${date}</title></head>
      <body style="font-family:sans-serif; padding:20px;">
        <h2 style="text-align:center;">Daily Sales Report: ${date}</h2>
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="padding:8px; border:1px solid #ddd;">Client</th>
              <th style="padding:8px; border:1px solid #ddd;">Product</th>
              <th style="padding:8px; border:1px solid #ddd;">Price</th>
              <th style="padding:8px; border:1px solid #ddd;">Profit</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// 8. INVENTORY UI
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

init();
