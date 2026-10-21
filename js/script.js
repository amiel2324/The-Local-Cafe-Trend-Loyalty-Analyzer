/**
 * THE LOCAL CAFE TREND & LOYALTY ANALYZER (Catbalogan City Branch)
 * Vanilla JavaScript Business Intelligence System & Presentation Controller
 */

// Global Pre-Populated Sample Transactions
const INITIAL_TRANSACTIONS = [
  { id: 101, timeOfDay: "Morning",   category: "Coffee/Drinks", paymentMethod: "GCash", billAmount: 160 },
  { id: 102, timeOfDay: "Morning",   category: "Pastries",      paymentMethod: "Cash",  billAmount: 95 },
  { id: 103, timeOfDay: "Afternoon", category: "Coffee/Drinks", paymentMethod: "GCash", billAmount: 180 },
  { id: 104, timeOfDay: "Afternoon", category: "Heavy Meals",   paymentMethod: "GCash", billAmount: 240 },
  { id: 105, timeOfDay: "Afternoon", category: "Pastries",      paymentMethod: "Cash",  billAmount: 120 },
  { id: 106, timeOfDay: "Evening",   category: "Heavy Meals",   paymentMethod: "Cash",  billAmount: 310 },
  { id: 107, timeOfDay: "Evening",   category: "Coffee/Drinks", paymentMethod: "GCash", billAmount: 150 },
  { id: 108, timeOfDay: "Morning",   category: "Coffee/Drinks", paymentMethod: "Cash",  billAmount: 140 }
];

// Active State Data
let transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
let activeFilter = "All";
let currentView = "dashboard";
let currentSlide = 1;
const totalSlides = 9;

// Global Function Attachments
window.deleteTransaction = function(id) {
  transactions = transactions.filter(item => item.id !== id);
  updateDashboard();
};

window.toggleMainView = function(forceTarget) {
  const dashboardView     = document.getElementById("dashboardView");
  const slidesView        = document.getElementById("slidesView");
  const toggleViewBtnText = document.getElementById("toggleViewBtnText");

  if (!dashboardView || !slidesView) return;

  if (forceTarget) {
    currentView = forceTarget;
  } else {
    currentView = (currentView === "dashboard") ? "slides" : "dashboard";
  }

  if (currentView !== "slides" && typeof window.exitPresentation === "function") {
    window.exitPresentation();
  }

  if (currentView === "slides") {
    dashboardView.classList.add("hidden");
    slidesView.classList.remove("hidden");
    if (toggleViewBtnText) toggleViewBtnText.textContent = "Switch to POS Dashboard";
  } else {
    slidesView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    if (toggleViewBtnText) toggleViewBtnText.textContent = "Switch to Slide Deck View";
    updateDashboard();
  }
};

window.goToSlide = function(slideNum) {
  if (slideNum < 1) slideNum = 1;
  if (slideNum > totalSlides) slideNum = totalSlides;

  currentSlide = slideNum;

  document.querySelectorAll(".slide-content").forEach(slide => {
    slide.classList.remove("active");
  });

  const activeSlideEl = document.querySelector(`.slide-content[data-slide="${currentSlide}"]`);
  if (activeSlideEl) activeSlideEl.classList.add("active");

  const slideIndicator = document.getElementById("slideIndicator");
  const slideSelect    = document.getElementById("slideSelect");
  const prevSlideBtn   = document.getElementById("prevSlideBtn");
  const nextSlideBtn   = document.getElementById("nextSlideBtn");

  if (slideIndicator) slideIndicator.textContent = `Slide ${currentSlide} of ${totalSlides}`;
  if (slideSelect) slideSelect.value = currentSlide;

  if (prevSlideBtn) prevSlideBtn.disabled = (currentSlide === 1);
  if (nextSlideBtn) nextSlideBtn.disabled = (currentSlide === totalSlides);

  const progressBar = document.getElementById("slideProgressBar");
  const counterFs   = document.getElementById("slideCounterFs");
  if (progressBar) progressBar.style.width = `${(currentSlide / totalSlides) * 100}%`;
  if (counterFs) counterFs.textContent = `${currentSlide} / ${totalSlides}`;
};

// ---- Presentation (fullscreen) mode ----
let controlsTimer = null;

function isNativeFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function showPresentControls() {
  const slidesView = document.getElementById("slidesView");
  if (!slidesView) return;
  slidesView.classList.remove("controls-hidden");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    const bar = slidesView.querySelector(".slide-controls-bar");
    const busy = bar && (bar.matches(":hover") || bar.contains(document.activeElement) && document.activeElement.tagName === "SELECT");
    if (slidesView.classList.contains("fullscreen-mode") && !busy) {
      slidesView.classList.add("controls-hidden");
    }
  }, 2500);
}

function setPresentUI(on) {
  const slidesView = document.getElementById("slidesView");
  const label = document.getElementById("enlargeBtnText");
  if (!slidesView) return;
  slidesView.classList.toggle("fullscreen-mode", on);
  document.body.classList.toggle("presenting", on);
  if (label) label.textContent = on ? "Exit Fullscreen" : "Present Fullscreen";
  if (on) {
    showPresentControls();
  } else {
    clearTimeout(controlsTimer);
    slidesView.classList.remove("controls-hidden");
  }
}

window.enterPresentation = function() {
  const slidesView = document.getElementById("slidesView");
  if (!slidesView) return;
  setPresentUI(true);
  const req = slidesView.requestFullscreen || slidesView.webkitRequestFullscreen;
  if (req) {
    try {
      const p = req.call(slidesView);
      if (p && p.catch) p.catch(() => {}); // CSS full-viewport mode stays as fallback
    } catch (err) { /* fallback already active */ }
  }
};

window.exitPresentation = function() {
  const slidesView = document.getElementById("slidesView");
  if (!slidesView || !slidesView.classList.contains("fullscreen-mode")) return;
  setPresentUI(false);
  if (isNativeFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) { try { const p = exit.call(document); if (p && p.catch) p.catch(() => {}); } catch (err) {} }
  }
};

window.togglePresentation = function() {
  const slidesView = document.getElementById("slidesView");
  if (slidesView && slidesView.classList.contains("fullscreen-mode")) {
    window.exitPresentation();
  } else {
    window.enterPresentation();
  }
};

// Global Dashboard Update Pipeline
function updateDashboard() {
  const filteredData = activeFilter === "All" 
    ? transactions 
    : transactions.filter(t => t.timeOfDay === activeFilter);

  renderTable(filteredData);
  calculateKPIs(filteredData);
  renderCanvasChart(filteredData);
  renderSecondaryAnalytics(filteredData);
}

// Render Table Feed
function renderTable(data) {
  const tableBody = document.getElementById("transactionTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#7d6554;">No records for shift: ${activeFilter}</td></tr>`;
    return;
  }

  [...data].reverse().forEach((item) => {
    const tr = document.createElement("tr");
    const timeClass = `badge-${item.timeOfDay.toLowerCase()}`;
    const payClass  = `badge-${item.paymentMethod.toLowerCase()}`;

    tr.innerHTML = `
      <td><span class="badge ${timeClass}">${item.timeOfDay}</span></td>
      <td>${item.category}</td>
      <td><span class="badge ${payClass}">${item.paymentMethod}</span></td>
      <td><strong>₱${item.billAmount.toFixed(2)}</strong></td>
      <td><button class="delete-btn" type="button" title="Delete Entry" onclick="deleteTransaction(${item.id})">&times;</button></td>
    `;

    tableBody.appendChild(tr);
  });
}

// Compute KPIs
function calculateKPIs(data) {
  const kpiRevenueEl    = document.getElementById("kpiRevenue");
  const kpiRevenueSubEl = document.getElementById("kpiRevenueSub");
  const kpiPaymentEl    = document.getElementById("kpiPayment");
  const kpiPaymentSubEl = document.getElementById("kpiPaymentSub");
  const kpiCountEl      = document.getElementById("kpiCount");

  if (!kpiRevenueEl || !kpiPaymentEl || !kpiCountEl) return;

  const totalRevenue = data.reduce((acc, curr) => acc + curr.billAmount, 0);
  kpiRevenueEl.textContent = `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  kpiRevenueSubEl.textContent = activeFilter === "All" ? "Across all shift records" : `${activeFilter} shift revenue`;

  let cashCount = 0;
  let gcashCount = 0;

  data.forEach(item => {
    if (item.paymentMethod === "Cash") cashCount++;
    if (item.paymentMethod === "GCash") gcashCount++;
  });

  if (data.length === 0) {
    kpiPaymentEl.textContent = "--";
    kpiPaymentSubEl.textContent = "No data available";
  } else if (cashCount > gcashCount) {
    kpiPaymentEl.textContent = "Cash";
    kpiPaymentSubEl.textContent = `Cash leads by ${cashCount - gcashCount} entry/entries`;
  } else if (gcashCount > cashCount) {
    kpiPaymentEl.textContent = "GCash";
    kpiPaymentSubEl.textContent = `GCash leads by ${gcashCount - cashCount} entry/entries`;
  } else {
    kpiPaymentEl.textContent = "Equal Split";
    kpiPaymentSubEl.textContent = `Both at ${cashCount} transaction(s)`;
  }

  kpiCountEl.textContent = data.length;
}

// Safe Canvas Drawing
function drawSafeRect(ctx, x, y, width, height) {
  ctx.fillRect(x, y, Math.max(width, 4), height);
}

// HTML5 Canvas Chart Renderer
function renderCanvasChart(data) {
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const categories = ["Coffee/Drinks", "Pastries", "Heavy Meals"];
  const totals = { "Coffee/Drinks": 0, "Pastries": 0, "Heavy Meals": 0 };

  data.forEach(item => {
    if (totals[item.category] !== undefined) {
      totals[item.category] += item.billAmount;
    }
  });

  const colors = {
    "Coffee/Drinks": "#a85d32",
    "Pastries": "#d49a55",
    "Heavy Meals": "#5b7b62"
  };

  const maxVal = Math.max(...Object.values(totals), 100);

  const paddingLeft = 110;
  const paddingTop = 25;
  const barHeight = 32;
  const gap = 28;
  const maxBarWidth = canvas.width - paddingLeft - 80;

  categories.forEach((cat, index) => {
    const val = totals[cat];
    const barWidth = (val / maxVal) * maxBarWidth;
    const y = paddingTop + index * (barHeight + gap);

    ctx.fillStyle = "#2c1b10";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(cat, paddingLeft - 12, y + barHeight / 2 + 4);

    ctx.fillStyle = "#e0d0bf";
    drawSafeRect(ctx, paddingLeft, y, maxBarWidth, barHeight);

    if (barWidth > 0) {
      ctx.fillStyle = colors[cat];
      drawSafeRect(ctx, paddingLeft, y, barWidth, barHeight);
    }

    ctx.fillStyle = "#2c1b10";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`₱${val.toFixed(0)}`, paddingLeft + barWidth + 8, y + barHeight / 2 + 4);
  });
}

// Secondary Analytics
function renderSecondaryAnalytics(data) {
  const gcashPercentText = document.getElementById("gcashPercentText");
  const cashPercentText  = document.getElementById("cashPercentText");
  const gcashFill        = document.getElementById("gcashFill");
  const cashFill         = document.getElementById("cashFill");
  const insightText      = document.getElementById("insightText");

  if (!gcashPercentText || !cashPercentText || !gcashFill || !cashFill || !insightText) return;

  const total = data.length;
  if (total === 0) {
    gcashPercentText.textContent = "0%";
    cashPercentText.textContent = "0%";
    gcashFill.style.width = "0%";
    cashFill.style.width = "0%";
    insightText.textContent = `No sales data recorded for shift filter: ${activeFilter}.`;
    return;
  }

  let gcashCount = 0;
  let cashCount = 0;

  data.forEach(d => {
    if (d.paymentMethod === "GCash") gcashCount++;
    if (d.paymentMethod === "Cash") cashCount++;
  });

  const gcashPct = Math.round((gcashCount / total) * 100);
  const cashPct  = Math.round((cashCount / total) * 100);

  gcashPercentText.textContent = `${gcashPct}% (${gcashCount})`;
  cashPercentText.textContent  = `${cashPct}% (${cashCount})`;

  gcashFill.style.width = `${gcashPct}%`;
  cashFill.style.width  = `${cashPct}%`;

  const shiftText = activeFilter === "All" ? "Overall operational trends" : `During the ${activeFilter} shift`;

  if (gcashPct > 60) {
    insightText.textContent = `${shiftText}, digital wallet usage is dominant (${gcashPct}% GCash). Recommendation: Highlight GCash QR codes at checkout counter to speed up order queues.`;
  } else if (cashPct > 60) {
    insightText.textContent = `${shiftText}, cash remains the top choice (${cashPct}% Cash). Recommendation: Maintain sufficient cash drawer bill denominations for quick local change.`;
  } else {
    insightText.textContent = `${shiftText}, customers show a balanced adoption of Cash and GCash. Ensure both payment channels are equally accessible.`;
  }
}

// Main Application Initialization Cycle
function initApp() {
  const toggleViewBtn     = document.getElementById("toggleViewBtn");
  const returnToPosBtn    = document.getElementById("returnToPosBtn");
  const transactionForm     = document.getElementById("transactionForm");
  const timeOfDaySelect     = document.getElementById("timeOfDay");
  const itemCategorySelect  = document.getElementById("itemCategory");
  const paymentMethodSelect = document.getElementById("paymentMethod");
  const billAmountInput     = document.getElementById("billAmount");
  const addSampleBtn        = document.getElementById("addSampleBtn");
  const resetDataBtn        = document.getElementById("resetDataBtn");

  const filterButtons       = document.querySelectorAll(".filter-btn");

  const prevSlideBtn     = document.getElementById("prevSlideBtn");
  const nextSlideBtn     = document.getElementById("nextSlideBtn");
  const slideSelect      = document.getElementById("slideSelect");
  const enlargeSlideBtn  = document.getElementById("enlargeSlideBtn");
  const enlargeBtnText   = document.getElementById("enlargeBtnText");
  const slidesView       = document.getElementById("slidesView");

  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => window.toggleMainView());
  }

  if (returnToPosBtn) {
    returnToPosBtn.addEventListener("click", () => window.toggleMainView("dashboard"));
  }

  if (prevSlideBtn) prevSlideBtn.addEventListener("click", () => window.goToSlide(currentSlide - 1));
  if (nextSlideBtn) nextSlideBtn.addEventListener("click", () => window.goToSlide(currentSlide + 1));
  if (slideSelect) slideSelect.addEventListener("change", (e) => window.goToSlide(parseInt(e.target.value, 10)));

  if (enlargeSlideBtn && slidesView) {
    enlargeSlideBtn.addEventListener("click", () => window.togglePresentation());
  }

  // Keep our UI in sync when the browser leaves fullscreen itself (e.g. Esc key)
  const onFsChange = () => {
    if (!isNativeFullscreen() && slidesView && slidesView.classList.contains("fullscreen-mode")) {
      setPresentUI(false);
    }
  };
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);

  // Reveal the floating controls whenever the mouse/finger moves in present mode
  if (slidesView) {
    ["mousemove", "mousedown", "touchstart"].forEach(evt =>
      slidesView.addEventListener(evt, () => {
        if (slidesView.classList.contains("fullscreen-mode")) showPresentControls();
      }, { passive: true })
    );
  }

  // Dropdown shouldn't keep keyboard focus (it would swallow the arrow keys)
  if (slideSelect) slideSelect.addEventListener("change", () => slideSelect.blur());

  // Navigation Keybindings
  document.addEventListener("keydown", (e) => {
    if (currentView !== "slides") return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const presenting = slidesView && slidesView.classList.contains("fullscreen-mode");
    if (presenting) showPresentControls();

    switch (e.key) {
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault(); window.goToSlide(currentSlide - 1); break;
      case "ArrowRight":
      case "PageDown":
        e.preventDefault(); window.goToSlide(currentSlide + 1); break;
      case " ":
        if (tag === "BUTTON" || tag === "SELECT") return;
        e.preventDefault(); window.goToSlide(currentSlide + 1); break;
      case "Home": e.preventDefault(); window.goToSlide(1); break;
      case "End":  e.preventDefault(); window.goToSlide(totalSlides); break;
      case "f":
      case "F":
        if (tag === "SELECT") return;
        window.togglePresentation(); break;
      case "Escape":
        if (presenting) window.exitPresentation(); break;
    }
  });

  // Form Submit Handler
  if (transactionForm) {
    transactionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amountValue = parseFloat(billAmountInput.value);
      if (isNaN(amountValue) || amountValue <= 0) return;

      transactions.push({
        id: Date.now(),
        timeOfDay: timeOfDaySelect.value,
        category: itemCategorySelect.value,
        paymentMethod: paymentMethodSelect.value,
        billAmount: amountValue
      });

      billAmountInput.value = "";
      updateDashboard();
    });
  }

  // Quick Sample Generator
  if (addSampleBtn) {
    addSampleBtn.addEventListener("click", () => {
      const categories = ["Coffee/Drinks", "Pastries", "Heavy Meals"];
      const shifts     = ["Morning", "Afternoon", "Evening"];
      const methods    = ["GCash", "Cash"];

      transactions.push({
        id: Date.now(),
        timeOfDay: shifts[Math.floor(Math.random() * shifts.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        paymentMethod: methods[Math.floor(Math.random() * methods.length)],
        billAmount: Math.floor(Math.random() * 220) + 80
      });

      updateDashboard();
    });
  }

  // Reset Data Handler
  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", () => {
      transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
      updateDashboard();
    });
  }

  // Shift Filter Buttons
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      updateDashboard();
    });
  });

  window.goToSlide(1);
  updateDashboard();
}

// DOM Readiness Check
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}