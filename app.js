"use strict";

/* ---------- Helpers ---------- */
const $ = (selector, parent = document) => parent.querySelector(selector);

function naira(amount) {
  return "₦" + Math.round(amount).toLocaleString();
}

/* ---------- Data ---------- */
const services = [
  ["⚡", "Same-Day Delivery", "Picked up and delivered within hours."],
  ["🚀", "Express Delivery", "Next-day delivery across major cities."],
  ["📍", "Local Delivery", "Fast city-wide drop-offs."],
  ["🛣️", "Interstate Delivery", "Reliable road network between states."],
  ["💼", "Business Logistics", "Contracts and dedicated account support."],
  ["🏭", "Warehousing & Fulfillment", "Store, pick, pack and ship."],
  ["🛍️", "E-commerce Delivery", "Last-mile delivery for online stores."],
  ["📦", "Bulk Shipping", "Pallets and large volumes at lower rates."]
];

const steps = [
  "Order Confirmed",
  "Package Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered"
];

const shipments = {
  HLR1001: {
    step: 2,
    from: "Lagos",
    to: "Abuja",
    eta: "Tomorrow, 2:00 PM",
    loc: "Lokoja Hub",
    status: "In Transit"
  },
  HLR1002: {
    step: 4,
    from: "Ikeja",
    to: "Lekki",
    eta: "Delivered today",
    loc: "Lekki Phase 1",
    status: "Delivered"
  },
  HLR1003: {
    step: 0,
    from: "Ibadan",
    to: "Lagos",
    eta: "In 3 days",
    loc: "Awaiting pickup",
    status: "Pending"
  }
};

const drivers = [
  { name: "Emeka O.", status: "On route", pkg: "HLR1001", progress: 62, eta: "1h 40m" },
  { name: "Aisha B.", status: "On route", pkg: "HLR1002", progress: 100, eta: "Arrived" },
  { name: "Tunde A.", status: "Available", pkg: "None", progress: 0, eta: "–" },
  { name: "Chidi N.", status: "Delayed", pkg: "HLR1004", progress: 35, eta: "3h 10m" }
];

const faqs = [
  ["How is the delivery fee calculated?", "By weight, package type and delivery speed. You see the estimate before you confirm."],
  ["Can I change the pickup date?", "Yes, up to 2 hours before the scheduled pickup."],
  ["What if my package is delayed?", "You get a notification with a new arrival time and a support link."]
];

const reviews = [
  ["Ngozi, shop owner", "Our online orders now arrive a day earlier."],
  ["Kelechi, engineer", "Live tracking meant I never had to call."],
  ["Sade, retailer", "Bulk shipping cut our costs noticeably."]
];

const notifications = [
  "Driver assigned to HLR1003",
  "Package picked up: HLR1001",
  "Shipment in transit: HLR1001",
  "Delivery delayed: HLR1004 (traffic)",
  "Package delivered: HLR1002"
];

/* ---------- Toast and modal ---------- */
let toastTimer;

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}

function openModal(title, body) {
  $("#mTitle").textContent = title;
  $("#mBody").textContent = body;
  $("#modal").hidden = false;
  $("#mClose").focus();
}

$("#mClose").onclick = () => {
  $("#modal").hidden = true;
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#modal").hidden = true;
    $("#notifPanel").hidden = true;
  }
});

/* ---------- Mobile menu and theme ---------- */
$("#burger").onclick = (event) => {
  const isOpen = $("#menu").classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", isOpen);
};

$("#menu").onclick = () => {
  $("#menu").classList.remove("open");
};

const root = document.documentElement;
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
let savedTheme = null;

try {
  savedTheme = localStorage.getItem("theme");
} catch (error) {
  savedTheme = null;
}

root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

$("#theme").onclick = () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";

  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch (error) {
    // Storage unavailable: the theme still changes for this visit.
  }

  drawChart();
};

/* ---------- Notifications ---------- */
function addNotification(message) {
  const item = document.createElement("li");
  item.textContent = message;
  $("#notifList").prepend(item);
  $("#bellCount").textContent = $("#notifList").children.length;
}

notifications.slice(0, 3).forEach(addNotification);

$("#bell").onclick = () => {
  $("#notifPanel").hidden = !$("#notifPanel").hidden;
};

let nextNotification = 3;

setInterval(() => {
  if (nextNotification < notifications.length) {
    const message = notifications[nextNotification];
    addNotification(message);
    toast(message);
    nextNotification++;
  }
}, 15000);

/* ---------- Services, drivers, FAQ, reviews ---------- */
$("#serviceGrid").innerHTML = services
  .map(([icon, title, text]) => `
    <article class="card">
      <div style="font-size: 1.8rem">${icon}</div>
      <h3>${title}</h3>
      <p class="muted">${text}</p>
    </article>`)
  .join("");

$("#driverGrid").innerHTML = drivers
  .map((d) => `
    <article class="card">
      <h3>${d.name}</h3>
      <span class="tag ${d.status}">${d.status}</span>
      <p class="muted">Package: ${d.pkg}<br>Arrival: ${d.eta}</p>
      <div class="bar"><i style="width: ${d.progress}%"></i></div>
      <small>${d.progress}% complete</small>
    </article>`)
  .join("");

$("#faqList").innerHTML = faqs
  .map(([question, answer]) => `
    <details>
      <summary>${question}</summary>
      <p class="muted">${answer}</p>
    </details>`)
  .join("");

$("#reviews").innerHTML = reviews
  .map(([name, quote]) => `
    <blockquote class="card" style="margin: 0">
      <p>“${quote}”</p>
      <small class="muted">${name}</small>
    </blockquote>`)
  .join("");

// FAQ accordion: opening one question closes the others.
document.querySelectorAll("details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    document.querySelectorAll("details[open]").forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

/* ---------- Tracking ---------- */
function formatStepTime(stepsAgo) {
  const date = new Date(Date.now() - stepsAgo * 8.64e6);
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function renderTrack(id) {
  const s = shipments[id];

  const timeline = steps
    .map((label, index) => {
      const done = index <= s.step;
      const time = done ? `<br><small>${formatStepTime(s.step - index)}</small>` : "";
      return `<li class="${done ? "done" : ""}">${label}${time}</li>`;
    })
    .join("");

  $("#trackResult").innerHTML = `
    <p><b>${id}</b> · ${s.from} to ${s.to} <span class="tag ${s.status}">${s.status}</span></p>
    <p class="muted">Estimated delivery: ${s.eta}<br>Last location: ${s.loc}</p>
    <ol class="timeline">${timeline}</ol>`;
}

$("#trackForm").onsubmit = (event) => {
  event.preventDefault();

  const id = $("#tn").value.trim().toUpperCase();
  const error = $("#tnErr");
  error.textContent = "";

  if (!id) {
    error.textContent = "Enter a tracking number.";
    return;
  }

  if (!shipments[id]) {
    error.textContent = "We can't find that number. Check it and try again.";
    return;
  }

  renderTrack(id);
};

/* ---------- Booking and pricing ---------- */
const form = $("#bookForm");

function estimate() {
  const fields = form.elements;
  const kg = parseFloat(fields.kg.value) || 0;
  const typeMultiplier = parseFloat(fields.type.value);
  const speedMultiplier = parseFloat(fields.speed.value);
  const fee = kg ? (1500 + kg * 350) * typeMultiplier * speedMultiplier : 0;

  $("#price").textContent = naira(fee);
  return fee;
}

form.addEventListener("input", estimate);

$("[data-quote]").onclick = () => {
  setTimeout(() => form.elements.from.focus(), 400);
};

form.onsubmit = (event) => {
  event.preventDefault();
  let valid = true;

  [...form.elements].forEach((field) => {
    if (field.tagName === "BUTTON") return;

    const invalid = !field.checkValidity();
    field.classList.toggle("bad", invalid);
    if (invalid) valid = false;
  });

  $("#bookErr").textContent = valid
    ? ""
    : "Please complete the highlighted fields with valid details.";

  if (!valid) return;

  const id = "HLR" + (1004 + Object.keys(shipments).length);
  const fee = estimate();

  shipments[id] = {
    step: 0,
    from: form.from.value,
    to: form.to.value,
    eta: "In 2–3 days",
    loc: "Awaiting pickup",
    status: "Pending"
  };

  renderShipList();
  renderStats();
  addNotification("Driver assigned to " + id);
  openModal("Booking confirmed", `Tracking number ${id}. Estimated fee ${naira(fee)}.`);
  toast("Booking confirmed");
  form.reset();
  estimate();
};

/* ---------- Dashboard ---------- */
function renderStats() {
  const all = Object.values(shipments);
  const count = (status) => all.filter((s) => s.status === status).length;

  const stats = [
    ["Active deliveries", count("In Transit")],
    ["Delivered", count("Delivered")],
    ["Pending", count("Pending")],
    ["Total orders", all.length],
    ["Success rate", "98.4%"]
  ];

  $("#stats").innerHTML = stats
    .map(([label, value]) => `
      <div class="card stat">
        <b>${value}</b>
        <span class="muted">${label}</span>
      </div>`)
    .join("");
}

function renderShipList() {
  const query = $("#search").value.toLowerCase();
  const status = $("#filter").value;

  const rows = Object.entries(shipments).filter(([id, s]) => {
    const matchesStatus = !status || s.status === status;
    const matchesQuery = (id + s.from + s.to).toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  if (!rows.length) {
    $("#shipList").innerHTML = "<li>No shipments match. Clear the search or filter.</li>";
    return;
  }

  $("#shipList").innerHTML = rows
    .map(([id, s]) => `
      <li data-id="${id}">
        <span>${id}<br><small class="muted">${s.from} to ${s.to}</small></span>
        <span class="tag ${s.status}">${s.status}</span>
      </li>`)
    .join("");
}

$("#search").oninput = renderShipList;
$("#filter").onchange = renderShipList;

$("#shipList").onclick = (event) => {
  const item = event.target.closest("li[data-id]");
  if (!item) return;

  $("#tn").value = item.dataset.id;
  renderTrack(item.dataset.id);
  location.hash = "#track";
};

function drawChart() {
  const canvas = $("#chart");
  const ctx = canvas.getContext("2d");
  const values = [40, 55, 48, 70, 82, 76, 95, 110, 98, 120, 132, 150];
  const months = "JFMAMJJASOND";
  const maxValue = 160;
  const barSlot = canvas.width / 12;
  const styles = getComputedStyle(root);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";

  values.forEach((value, i) => {
    const barHeight = (value / maxValue) * (canvas.height - 30);
    const x = i * barSlot;

    ctx.fillStyle = styles.getPropertyValue("--accent");
    ctx.fillRect(x + 8, canvas.height - 24 - barHeight, barSlot - 16, barHeight);

    ctx.fillStyle = styles.getPropertyValue("--muted");
    ctx.fillText(months[i], x + barSlot / 2, canvas.height - 6);
  });
}

/* ---------- Start ---------- */
renderStats();
renderShipList();
estimate();
drawChart();