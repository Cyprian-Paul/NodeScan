// ===== MOCK DATA =====
let devices = [
  { id: 1, name: "Core Router",       ip: "192.168.1.1",   type: "Router",      status: "online",  ping: 4,   uptime: 99.9, lastSeen: "just now"     },
  { id: 2, name: "Main Switch",        ip: "192.168.1.2",   type: "Switch",      status: "online",  ping: 7,   uptime: 99.8, lastSeen: "just now"     },
  { id: 3, name: "Web Server",         ip: "192.168.1.10",  type: "Server",      status: "online",  ping: 12,  uptime: 98.5, lastSeen: "just now"     },
  { id: 4, name: "File Server",        ip: "192.168.1.11",  type: "Server",      status: "warning", ping: 88,  uptime: 94.2, lastSeen: "2 min ago"    },
  { id: 5, name: "Backup Server",      ip: "192.168.1.12",  type: "Server",      status: "offline", ping: null, uptime: 81.0, lastSeen: "14 min ago"  },
  { id: 6, name: "Perimeter Firewall", ip: "192.168.1.3",   type: "Firewall",    status: "online",  ping: 5,   uptime: 99.9, lastSeen: "just now"     },
  { id: 7, name: "Office AP-01",       ip: "192.168.1.50",  type: "Access Point",status: "online",  ping: 22,  uptime: 97.1, lastSeen: "just now"     },
  { id: 8, name: "Dev Workstation",    ip: "192.168.1.101", type: "Workstation", status: "offline", ping: null, uptime: 62.3, lastSeen: "1 hr ago"    }
];

let eventLog = [
  { time: "10:42:01", level: "CRIT", msg: "Backup Server (192.168.1.12) went offline - no response" },
  { time: "10:39:55", level: "WARN", msg: "File Server ping spiked to 88ms - high latency detected" },
  { time: "10:35:10", level: "INFO", msg: "Dev Workstation (192.168.1.101) disconnected from network" },
  { time: "10:28:00", level: "OK",   msg: "All core devices checked - no issues found" },
  { time: "10:20:44", level: "INFO", msg: "Network scan completed - 8 devices found" },
  { time: "10:15:30", level: "OK",   msg: "Perimeter Firewall firmware up to date" },
  { time: "10:01:00", level: "INFO", msg: "Monitoring session started by admin" },
];

let pingHistory = [8, 11, 7, 15, 9, 18, 12, 10, 14, 8, 22, 11];

let pingChartCtx, donutCtx;
let pingInterval, statusInterval;

// ===== AUTH =====
function handleLogin() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  const err = document.getElementById("login-error");

  if (u === "admin" && p === "admin123") {
    err.classList.add("hidden");
    document.getElementById("login-page").classList.remove("active");
    document.getElementById("dashboard-page").classList.add("active");
    initDashboard();
  } else {
    err.classList.remove("hidden");
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.getElementById("login-page").classList.contains("active")) {
    handleLogin();
  }
});

function handleLogout() {
  clearInterval(pingInterval);
  clearInterval(statusInterval);
  document.getElementById("dashboard-page").classList.remove("active");
  document.getElementById("login-page").classList.add("active");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// ===== DASHBOARD INIT =====
function initDashboard() {
  updateClock();
  setInterval(updateClock, 1000);
  renderOverviewStats();
  renderQuickList();
  renderDeviceTable();
  renderAlerts();
  renderEventLog();
  initCharts();
  setupNav();
  pingInterval = setInterval(simulateLiveUpdates, 3500);
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("clock").textContent = `${h}:${m}:${s}`;
}

// ===== STATS =====
function renderOverviewStats() {
  const total = devices.length;
  const online = devices.filter(d => d.status === "online").length;
  const offline = devices.filter(d => d.status === "offline").length;
  const onlineDevices = devices.filter(d => d.status === "online");
  const avgUptime = onlineDevices.length ? (onlineDevices.reduce((a, d) => a + d.uptime, 0) / onlineDevices.length).toFixed(1) : 0;
  const pingDevices = devices.filter(d => d.ping !== null);
  const avgPing = pingDevices.length ? Math.round(pingDevices.reduce((a, d) => a + d.ping, 0) / pingDevices.length) : 0;
  const alerts = getAlerts().length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-online").textContent = online;
  document.getElementById("stat-offline").textContent = offline;
  document.getElementById("stat-uptime").textContent = avgUptime + "%";
  document.getElementById("stat-ping").textContent = avgPing + "ms";
  document.getElementById("stat-alerts").textContent = alerts;
  document.getElementById("alert-badge").textContent = alerts;

  const badge = document.getElementById("network-health-badge");
  const dot = badge.querySelector(".health-dot");
  const txt = badge.querySelector("span:last-child");
  if (offline === 0 && alerts <= 1) {
    dot.className = "health-dot green";
    txt.textContent = "Network Healthy";
  } else if (offline >= 2 || alerts >= 3) {
    dot.className = "health-dot red";
    txt.textContent = "Issues Detected";
  } else {
    dot.className = "health-dot orange";
    txt.textContent = "Degraded";
  }
}

// ===== QUICK LIST =====
function renderQuickList() {
  const container = document.getElementById("quick-device-list");
  container.innerHTML = devices.map(d => {
    const pingStr = d.ping !== null ? d.ping + "ms" : "---";
    const uptimeClass = d.uptime >= 99 ? "good" : d.uptime >= 90 ? "warn" : "bad";
    return `
      <div class="quick-device">
        <span class="qd-status ${d.status}"></span>
        <span class="qd-name">${d.name}</span>
        <span class="qd-ip">${d.ip}</span>
        <span class="qd-ping">${pingStr}</span>
        <span class="qd-uptime ${uptimeClass}">${d.uptime}%</span>
      </div>`;
  }).join("");
}

// ===== DEVICE TABLE =====
function renderDeviceTable() {
  const q = (document.getElementById("device-search")?.value || "").toLowerCase();
  const tbody = document.getElementById("device-table-body");
  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(q) || d.ip.includes(q)
  );
  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td>${d.name}</td>
      <td style="font-family:var(--font-mono); color:var(--text-dim)">${d.ip}</td>
      <td>${d.type}</td>
      <td><span class="status-pill ${d.status}">${d.status.toUpperCase()}</span></td>
      <td style="font-family:var(--font-mono); color:var(--blue)">${d.ping !== null ? d.ping + " ms" : "---"}</td>
      <td style="font-family:var(--font-mono); color:${d.uptime >= 99 ? 'var(--green)' : d.uptime >= 90 ? 'var(--orange)' : 'var(--red)'}">${d.uptime}%</td>
      <td style="color:var(--text-dim)">${d.lastSeen}</td>
    </tr>`).join("");
}

// ===== ALERTS =====
function getAlerts() {
  const alerts = [];
  devices.forEach(d => {
    if (d.status === "offline") {
      alerts.push({ type: "critical", icon: "🔴", title: `${d.name} is OFFLINE`, desc: `Device at ${d.ip} is not responding to pings. Last seen: ${d.lastSeen}.`, time: d.lastSeen });
    } else if (d.status === "warning") {
      alerts.push({ type: "warning", icon: "🟠", title: `${d.name} — High Latency`, desc: `Ping at ${d.ping}ms is above the 50ms threshold. Check device load.`, time: "Just now" });
    }
  });
  if (alerts.length === 0) {
    alerts.push({ type: "info", icon: "🟢", title: "All systems operational", desc: "No critical alerts at this time.", time: "Just now" });
  }
  return alerts;
}

function renderAlerts() {
  const container = document.getElementById("alerts-list");
  const alerts = getAlerts();
  container.innerHTML = alerts.map(a => `
    <div class="alert-item ${a.type}">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        <div class="alert-time">${a.time}</div>
      </div>
    </div>`).join("");
}

// ===== EVENT LOG =====
function renderEventLog() {
  const container = document.getElementById("event-log");
  container.innerHTML = eventLog.map(e => `
    <div class="log-entry">
      <span class="log-time">${e.time}</span>
      <span class="log-level ${e.level}">[${e.level}]</span>
      <span class="log-msg">${e.msg}</span>
    </div>`).join("");
}

function clearLog() {
  eventLog = [];
  renderEventLog();
}

function addLogEntry(level, msg) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  eventLog.unshift({ time, level, msg });
  if (eventLog.length > 60) eventLog.pop();
  renderEventLog();
}

// ===== CHARTS =====
function initCharts() {
  drawPingChart();
  drawDonut();
}

function drawPingChart() {
  const canvas = document.getElementById("ping-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  pingChartCtx = ctx;
  renderPingChart(ctx, canvas);
}

function renderPingChart(ctx, canvas) {
  const w = canvas.offsetWidth || 600;
  const h = canvas.height || 120;
  canvas.width = w;
  ctx.clearRect(0, 0, w, h);

  const data = pingHistory;
  const max = Math.max(...data) + 10;
  const min = 0;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (w - 40) + 20,
    y: h - 20 - ((v - min) / (max - min)) * (h - 30)
  }));

  // Grid lines
  ctx.strokeStyle = "rgba(26,48,64,0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 10 + (i / 4) * (h - 30);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(0,255,136,0.18)");
  grad.addColorStop(1, "rgba(0,255,136,0)");
  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88";
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = "rgba(122,154,170,0.7)";
  ctx.font = "10px 'Share Tech Mono', monospace";
  data.forEach((v, i) => {
    const p = points[i];
    ctx.fillText(v + "ms", p.x - 12, p.y - 8);
  });
}

function drawDonut() {
  const canvas = document.getElementById("status-donut");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  donutCtx = ctx;
  renderDonut(ctx, canvas);
}

function renderDonut(ctx, canvas) {
  const online = devices.filter(d => d.status === "online").length;
  const offline = devices.filter(d => d.status === "offline").length;
  const warning = devices.filter(d => d.status === "warning").length;
  const total = devices.length;

  const w = canvas.offsetWidth || 260;
  const h = canvas.height || 160;
  canvas.width = w;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2 - 5;
  const r = Math.min(cx, cy) - 12;
  const inner = r * 0.58;

  const slices = [
    { val: online,  color: "#00ff88" },
    { val: offline, color: "#ff3b5c" },
    { val: warning, color: "#ff9100" }
  ].filter(s => s.val > 0);

  let start = -Math.PI / 2;
  slices.forEach(s => {
    const angle = (s.val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    // gap
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, start, start + angle);
    ctx.strokeStyle = "#050c10";
    ctx.lineWidth = 2;
    ctx.stroke();

    start += angle;
  });

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = "#0d1c23";
  ctx.fill();

  // Center text
  ctx.fillStyle = "#00ff88";
  ctx.font = `bold ${Math.round(r * 0.42)}px 'Share Tech Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.round((online / total) * 100) + "%", cx, cy - 4);
  ctx.fillStyle = "rgba(122,154,170,0.7)";
  ctx.font = `${Math.round(r * 0.22)}px 'Share Tech Mono', monospace`;
  ctx.fillText("online", cx, cy + r * 0.3);
}

// ===== LIVE SIMULATION =====
function simulateLiveUpdates() {
  // Update pings for online devices
  devices.forEach(d => {
    if (d.status === "online") {
      const drift = Math.floor(Math.random() * 11) - 5;
      d.ping = Math.max(2, Math.min(120, d.ping + drift));
    }
  });

  // Random minor event
  const rand = Math.random();
  if (rand < 0.15) {
    const onlineDevices = devices.filter(d => d.status === "online");
    if (onlineDevices.length > 2) {
      const d = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
      addLogEntry("INFO", `Routine check passed for ${d.name} (${d.ip}) — ${d.ping}ms`);
    }
  }

  // Update ping chart
  const allPings = devices.filter(d => d.ping !== null);
  if (allPings.length) {
    const avg = Math.round(allPings.reduce((a, d) => a + d.ping, 0) / allPings.length);
    pingHistory.push(avg);
    if (pingHistory.length > 14) pingHistory.shift();
  }

  refreshAllViews();
}

function refreshAllViews() {
  renderOverviewStats();
  renderQuickList();
  renderDeviceTable();
  renderAlerts();

  const c1 = document.getElementById("ping-chart");
  if (c1) renderPingChart(pingChartCtx, c1);
  const c2 = document.getElementById("status-donut");
  if (c2) renderDonut(donutCtx, c2);
}

// ===== NAV =====
function setupNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
      const target = document.getElementById("section-" + section);
      if (target) target.classList.add("active");

      const titles = {
        "overview": "Overview",
        "devices": "Devices",
        "alerts": "Alerts",
        "logs": "Event Log",
        "add-device": "Add Device"
      };
      document.getElementById("page-title").textContent = titles[section] || "Dashboard";

      if (section === "logs") renderEventLog();
    });
  });
}

// ===== ADD DEVICE =====
function addDevice() {
  const name = document.getElementById("new-name").value.trim();
  const ip = document.getElementById("new-ip").value.trim();
  const type = document.getElementById("new-type").value;
  const status = document.getElementById("new-status").value;
  const ping = parseFloat(document.getElementById("new-ping").value);
  const uptime = parseFloat(document.getElementById("new-uptime").value);
  const err = document.getElementById("add-error");

  if (!name || !ip || isNaN(ping) || isNaN(uptime) || ping < 0 || uptime < 0 || uptime > 100) {
    err.classList.remove("hidden");
    return;
  }
  err.classList.add("hidden");

  const newDevice = {
    id: devices.length + 1,
    name, ip, type,
    status: status,
    ping: status === "offline" ? null : ping,
    uptime,
    lastSeen: "just now"
  };

  devices.push(newDevice);
  addLogEntry("INFO", `New device added: ${name} (${ip}) — type: ${type}`);

  // Clear form
  document.getElementById("new-name").value = "";
  document.getElementById("new-ip").value = "";
  document.getElementById("new-ping").value = "";
  document.getElementById("new-uptime").value = "";

  refreshAllViews();

  // Navigate to Devices section
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelector('[data-section="devices"]').classList.add("active");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-devices").classList.add("active");
  document.getElementById("page-title").textContent = "Devices";
}

// ===== RESIZE CHARTS =====
window.addEventListener("resize", () => {
  const c1 = document.getElementById("ping-chart");
  if (c1 && pingChartCtx) renderPingChart(pingChartCtx, c1);
  const c2 = document.getElementById("status-donut");
  if (c2 && donutCtx) renderDonut(donutCtx, c2);
});
