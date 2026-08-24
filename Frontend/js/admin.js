const API_BASE = "http://localhost:3000";

const demoUser = {
  username: "petugas",
  password: "123456"
};

const NOTIFICATION_KEY = "sigap-notifications";

const state = {
  reports: [],
  filters: {
    status: "Semua",
    prioritas: "Semua"
  }
};

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const logoutBtn = document.getElementById("logoutBtn");
const userBadge = document.getElementById("userBadge");

const filterStatus = document.getElementById("filterStatus");
const filterPrioritas = document.getElementById("filterPrioritas");
const reportsBody = document.getElementById("reportsBody");
const reportsEmpty = document.getElementById("reportsEmpty");
const statTotal = document.getElementById("statTotal");
const statMenunggu = document.getElementById("statMenunggu");
const statDiproses = document.getElementById("statDiproses");
const statSelesai = document.getElementById("statSelesai");
const categoryStats = document.getElementById("categoryStats");
const statusStats = document.getElementById("statusStats");
const statusMessage = document.getElementById("statusMessage");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStoredNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "[]") || [];
  } catch (error) {
    return [];
  }
}

function saveNotification(report, status) {
  if (!report?.nomor_hp) return;

  const notifications = getStoredNotifications();
  notifications.unshift({
    id: Date.now(),
    nomor_hp: report.nomor_hp,
    title: status === "Selesai" ? "Laporan selesai" : "Status laporan diperbarui",
    message: status === "Selesai"
      ? `Laporan Anda untuk ${report.kategori || "aduan"} sudah selesai ditangani.`
      : `Status laporan Anda untuk ${report.kategori || "aduan"} sekarang ${status}.`,
    created_at: new Date().toISOString()
  });

  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications.slice(0, 10)));
}

function showBrowserNotification(message) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("SIGAP Kota", { body: message });
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function renderAuthScreen() {
  const isLoggedIn = sessionStorage.getItem("sigap-admin-auth") === "true";
  loginView.classList.toggle("hidden", isLoggedIn);
  dashboardView.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    userBadge.textContent = `Petugas: ${demoUser.username}`;
    loadReports();
  }
}

function setMessage(element, text, type = "error") {
  element.textContent = text;
  element.className = `form-message ${type}`;
}

function setStatusMessage(text, type = "info") {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function badgeClass(status) {
  const map = {
    Menunggu: "badge-menunggu",
    Diproses: "badge-diproses",
    Selesai: "badge-selesai"
  };
  return map[status] || "badge-menunggu";
}

function priorityClass(prioritas) {
  const value = (prioritas || "").toLowerCase();
  if (value.includes("tinggi") || value.includes("darurat")) return "badge-prioritas-tinggi";
  if (value.includes("sedang") || value.includes("medium")) return "badge-prioritas-sedang";
  return "badge-prioritas-rendah";
}

function getFilteredReports() {
  return state.reports.filter((item) => {
    const statusMatch = state.filters.status === "Semua" || item.status === state.filters.status;
    const prioritasMatch = state.filters.prioritas === "Semua" || (item.prioritas || "").toLowerCase() === state.filters.prioritas.toLowerCase();
    return statusMatch && prioritasMatch;
  });
}

function renderStats() {
  const total = state.reports.length;
  const waiting = state.reports.filter((item) => item.status === "Menunggu").length;
  const processed = state.reports.filter((item) => item.status === "Diproses").length;
  const done = state.reports.filter((item) => item.status === "Selesai").length;

  statTotal.textContent = total;
  statMenunggu.textContent = waiting;
  statDiproses.textContent = processed;
  statSelesai.textContent = done;

  const categoryMap = {};
  state.reports.forEach((item) => {
    const key = item.kategori || "Lainnya";
    categoryMap[key] = (categoryMap[key] || 0) + 1;
  });

  const statusMap = {
    Menunggu: waiting,
    Diproses: processed,
    Selesai: done
  };

  categoryStats.innerHTML = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${value}</strong></li>`)
    .join("");

  statusStats.innerHTML = Object.entries(statusMap)
    .map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${value}</strong></li>`)
    .join("");
}

function renderReports() {
  const filtered = getFilteredReports();
  renderStats();

  if (!filtered.length) {
    reportsEmpty.classList.remove("hidden");
    reportsBody.innerHTML = "";
    return;
  }

  reportsEmpty.classList.add("hidden");
  reportsBody.innerHTML = filtered.map((item) => `
    <tr class="report-row" data-id="${item.id}">
      <td>${escapeHtml(formatDate(item.created_at))}</td>
      <td>${escapeHtml(item.nomor_hp || "-")}</td>
      <td>${escapeHtml(item.ringkasan || item.alasan || "-")}</td>
      <td>${escapeHtml(item.kategori || "-")}</td>
      <td><span class="status-badge ${priorityClass(item.prioritas)}">${escapeHtml(item.prioritas || "-")}</span></td>
      <td>${escapeHtml(item.instansi || "-")}</td>
      <td><span class="text-link">Buka detail →</span></td>
    </tr>
  `).join("");
}

async function loadReports() {
  try {
    const response = await fetch(`${API_BASE}/api/progress`);
    if (!response.ok) {
      throw new Error("Gagal mengambil data aduan.");
    }

    const result = await response.json();
    state.reports = Array.isArray(result.data) ? result.data : [];
    renderReports();
    setStatusMessage("Data aduan berhasil diperbarui.", "info");
  } catch (error) {
    console.error(error);
    setStatusMessage(error.message || "Tidak bisa terhubung ke server.", "error");
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === demoUser.username && password === demoUser.password) {
    sessionStorage.setItem("sigap-admin-auth", "true");
    requestNotificationPermission();
    renderAuthScreen();
    setMessage(loginMessage, "Login berhasil.", "success");
    loginForm.reset();
  } else {
    setMessage(loginMessage, "Username atau password salah. Coba petugas / 123456", "error");
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("sigap-admin-auth");
  renderAuthScreen();
  setMessage(loginMessage, "Anda telah keluar.", "info");
});

filterStatus.addEventListener("change", (event) => {
  state.filters.status = event.target.value;
  renderReports();
});

filterPrioritas.addEventListener("change", (event) => {
  state.filters.prioritas = event.target.value;
  renderReports();
});

reportsBody.addEventListener("click", (event) => {
  const row = event.target.closest(".report-row");
  if (!row) return;

  const id = row.dataset.id;
  window.location.href = `hasil.html?id=${encodeURIComponent(id)}`;
});

window.addEventListener("focus", () => {
  if (sessionStorage.getItem("sigap-admin-auth") === "true") {
    loadReports();
  }
});

setInterval(() => {
  if (sessionStorage.getItem("sigap-admin-auth") === "true") {
    loadReports();
  }
}, 10000);

renderAuthScreen();
