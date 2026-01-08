// 1. MASTER DATA
const startingInventory = [
  { name: "R23mm", size: "23mm", quantity: 23, cost: 2000 },
  { name: "Round 40/42mm", size: "40/42mm", quantity: 89, cost: 2000 },
  { name: "Oval 5237mm", size: "5237mm", quantity: 27, cost: 2000 },
  { name: "Rectanglw 1580mm", size: "1580mm", quantity: 20, cost: 2000 },
  { name: "Rectangle 2278mm", size: "2278mm", quantity: 5, cost: 2000 },
  { name: "Rectangle 3363mm", size: "33x63mm", quantity: 24, cost: 2000 },
  { name: "Manual PAID/ RECEIVED", size: "P/R", quantity: 18, cost: 1200 },
  { name: "Rectangle 80100mm", size: "80x100mm", quantity: 49, cost: 3000 },
  { name: "Rectangle 6090mm", size: "60x90mm", quantity: 12, cost: 3000 },
  { name: "Wax Stamp", size: "20mm", quantity: 49, cost: 2500 },
  { name: "Fabric Ink", size: "10ml", quantity: 50, cost: 500 },
  { name: "Nylon Ink", size: "10ml", quantity: 50, cost: 500 },
  { name: "Paper Ink", size: "10ml", quantity: 50, cost: 500 }
];

// 2. DATA PERSISTENCE (THE FIX)
let inventory = JSON.parse(localStorage.getItem("currentInventory"));
if (!inventory || inventory.length === 0) {
    inventory = startingInventory;
    localStorage.setItem("currentInventory", JSON.stringify(inventory));
}
let sales = JSON.parse(localStorage.getItem("sales")) || [];

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzOOmbZPgmcRdvaPiqCih_J1QBb2jtWkAbg-xdj0PlenDn1nUEjCv5qejtZLfjggQ/exec";

// 3. INITIALIZE
function init() {
    const stampType = document.getElementById("stampType");
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

// 4. CATEGORY TOGGLE
document.getElementById("category").addEventListener("change", (e) => {
    document.getElementById("stampSection").style.display = e.target.value === "Stamp" ? "block" : "none";
    document.getElementById("otherSection").style.display = e.target.value === "Other" ? "block" : "none";
});

// 5. RESTOCK FUNCTION (Defined globally so HTML can see it)
window.restockItem = function(index) {
    const amount = prompt(`Add stock for ${inventory[index].name}:`);
    if (amount !== null && amount !== "" && !isNaN(amount)) {
        inventory[index].quantity += parseInt(amount);
        localStorage.setItem("currentInventory", JSON.stringify(inventory));
        loadInventory();
        alert("Stock updated!");
    }
};

// 6. SALES SUBMISSION
document.getElementById("salesForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const priceCharged = Number(document.getElementById("priceCharged").value);
    const qtySold = Number(document.getElementById("quantitySold").value);
    const categoryValue = document.getElementById("category").value;
    let unitCost = 0;
    let productName = "";

    if (categoryValue === "Stamp") {
        const stampName = document.getElementById("stampType").value;
        const selected = inventory.find(i => i.name === stampName);
        if(!selected) return alert("Select an item");
        unitCost = selected.cost;
        productName = selected.name;
        selected.quantity -= qtySold;
    } else {
        productName = document.getElementById("productName").value;
        unitCost = Number(document.getElementById("productCost").value);
    }

    const totalCost = unitCost * qtySold;
    const record = {
        client: document.getElementById("client").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        category: categoryValue,
        product: productName,
        quantity: qtySold,
        priceCharged: priceCharged,
        productCost: totalCost,
        profit: priceCharged - totalCost
    };

    sales.push(record);
    localStorage.setItem("sales", JSON.stringify(sales));
    localStorage.setItem("currentInventory", JSON.stringify(inventory));
    
    updateDashboard();
    loadInventory();

    try {
        await fetch(GOOGLE_SHEET_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(record) });
    } catch (err) { console.error("Cloud sync failed"); }

    e.target.reset();
    init();
});

// 7. UI UPDATES
function loadInventory() {
    const list = document.getElementById("inventoryList");
    list.innerHTML = "";
    inventory.forEach((item, index) => {
        const isLow = item.quantity <= 5;
        const li = document.createElement("li");
        li.innerHTML = `
            <div style="flex: 1;">
                <strong>${item.name}</strong><br>
                <span class="${isLow ? 'low-stock-alert' : ''}">Stock: ${item.quantity}</span>
            </div>
            <button onclick="window.restockItem(${index})" style="width: auto; background: #007bff; color: white; padding: 5px 10px;">+ Restock</button>
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

// 8. GLOBAL HELPERS
window.filterByDate = function() {
    const d = document.getElementById("filterDate").value;
    updateDashboard(sales.filter(s => s.date === d));
};

window.clearFilter = function() { updateDashboard(sales); };

window.monthlySummary = function() {
    const m = document.getElementById("monthPicker").value;
    const filtered = sales.filter(s => s.date.startsWith(m));
    let ms = 0, mp = 0;
    filtered.forEach(f => { ms += f.priceCharged; mp += f.profit; });
    document.getElementById("monthlySales").textContent = ms.toLocaleString();
    document.getElementById("monthlyProfit").textContent = mp.toLocaleString();
};

init();
