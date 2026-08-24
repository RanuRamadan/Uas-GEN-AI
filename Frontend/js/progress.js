const nomorHpInput = document.getElementById("nomorHpInput");
const cekBtn = document.getElementById("cekBtn");
const resultArea = document.getElementById("resultArea");

/* ======================================== */

function formatTanggal(isoString) {
    // SQLite datetime('now','localtime') -> "YYYY-MM-DD HH:MM:SS"
    const d = new Date(isoString.replace(" ", "T"));

    if (isNaN(d.getTime())) return isoString;

    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function statusClass(status) {
    const map = {
        "Menunggu": "badge-status-menunggu",
        "Diproses": "badge-status-diproses",
        "Selesai": "badge-status-selesai"
    };
    return map[status] || "badge-status-menunggu";
}

function prioritasClass(prioritas) {
    const p = (prioritas || "").toLowerCase();
    if (p.includes("tinggi") || p.includes("urgent") || p.includes("darurat")) return "badge-prioritas-tinggi";
    if (p.includes("sedang") || p.includes("medium")) return "badge-prioritas-sedang";
    return "badge-prioritas-rendah";
}

/* ======================================== */

function renderEmpty(message) {
    resultArea.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>${message}</p>
        </div>
    `;
}

function renderError(message) {
    resultArea.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p>${message}</p>
        </div>
    `;
}

function renderLoading() {
    resultArea.innerHTML = `
        <div class="loading-state">
            Memuat riwayat laporan...
        </div>
    `;
}

function renderList(laporanList) {

    if (laporanList.length === 0) {
        renderEmpty("Belum ada laporan yang tercatat untuk nomor HP ini.");
        return;
    }

    const cards = laporanList.map(item => `
        <div class="laporan-card">
            <div class="laporan-card-top">
                <div class="laporan-kategori">${item.kategori || "Tanpa kategori"}</div>
                <div class="laporan-tanggal">${formatTanggal(item.created_at)}</div>
            </div>
            <div class="laporan-ringkasan">${item.ringkasan || "-"}</div>
            <div class="badge-row">
                <span class="badge ${statusClass(item.status)}">${item.status}</span>
                <span class="badge ${prioritasClass(item.prioritas)}">Prioritas ${item.prioritas || "-"}</span>
            </div>
        </div>
    `).join("");

    resultArea.innerHTML = `<div class="laporan-list">${cards}</div>`;
}

/* ======================================== */

async function cekRiwayat() {

    const nomorHp = nomorHpInput.value.trim();

    if (nomorHp === "") {
        renderError("Masukkan nomor HP terlebih dahulu.");
        return;
    }

    cekBtn.disabled = true;
    renderLoading();

    try {

        const res = await fetch(`http://localhost:3000/api/progress/${encodeURIComponent(nomorHp)}`);
        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || "Gagal mengambil data.");
        }

        renderList(result.data || []);

    } catch (err) {

        console.error(err);
        renderError("Gagal memuat riwayat. Pastikan koneksi Anda stabil dan coba lagi.");

    } finally {

        cekBtn.disabled = false;

    }

}

/* ======================================== */

cekBtn.addEventListener("click", cekRiwayat);

nomorHpInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") cekRiwayat();
});
