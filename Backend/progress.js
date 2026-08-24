// progress.js — logic khusus halaman progress.html
// warga cuma lihat aduan miliknya sendiri (dicocokkan lewat nama tersimpan)

const nameInput = document.getElementById("nameInput");
const listArea = document.getElementById("listArea");

nameInput.value = getUserName();
nameInput.addEventListener("input", () => {
  setUserName(nameInput.value.trim());
  render();
});

const STATUS_STEPS = ["Baru", "Diproses", "Selesai"];

function render() {
  const nama = getUserName();
  if (!nama) {
    listArea.innerHTML = `<div class="empty">Isi nama kamu dulu di pojok kanan atas buat lihat aduan kamu.</div>`;
    return;
  }
  const mine = getComplaints().filter(c => c.nama === nama);
  if (!mine.length) {
    listArea.innerHTML = `<div class="empty">Belum ada aduan dari kamu. Yuk kirim aduan pertama di halaman Chat.</div>`;
    return;
  }
  listArea.innerHTML = mine.map(c => {
    const stepIndex = STATUS_STEPS.indexOf(c.status);
    const stepsHtml = STATUS_STEPS.map((s, i) => {
      const cls = i < stepIndex ? "done" : (i === stepIndex ? "current" : "");
      return `<div class="step ${cls}"></div>`;
    }).join("");
    return `
      <div class="progress-item">
        <div class="top-row">
          <span class="badge ${c.prioritas}">${c.prioritas}</span>
          <span class="badge status-${c.status}">${c.status}</span>
        </div>
        <div class="teks">${escapeHtml(c.teks)}</div>
        <div class="meta">${escapeHtml(c.kategori)} · diteruskan ke ${escapeHtml(c.instansi)} · ${escapeHtml(c.timestamp)}</div>
        <div class="steps">${stepsHtml}</div>
      </div>
    `;
  }).join("");
}

// auto-update kalau status diubah admin di tab/halaman lain
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) render();
});

render();
