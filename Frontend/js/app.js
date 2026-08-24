/* =====================================================
   CHAT LOGIC
===================================================== */

const chatBody = document.getElementById("chatBody");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");

const typing = document.getElementById("typing");

let selectedImage = null;

// Riwayat percakapan (dikirim ke backend tiap request supaya AI tetap ingat
// konteks sebelumnya, misalnya lokasi yang sudah pernah disebutkan warga).
let chatHistory = [];

function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

function createMessage(text, type = "ai") {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${type}`;
    wrapper.innerHTML = `<div class="bubble">${text}</div>`;
    chatBody.appendChild(wrapper);
    scrollBottom();
}

function createAnalysisCard(data) {

    const wrapper = document.createElement("div");
    wrapper.className = "message ai";

    wrapper.innerHTML = `
    <div class="bubble analysis-card">
        <h3>📋 Ringkasan Laporan</h3>
        <hr>
        <p><b>Kategori</b><br>${data.kategori}</p>
        <p><b>Prioritas</b><br>${data.prioritas}</p>
        <p><b>Instansi</b><br>${data.instansi}</p>
        <p><b>Ringkasan</b><br>${data.ringkasan}</p>
        <p><b>Alasan</b><br>${data.alasan}</p>
        <p><b>Saran</b><br>${data.saran}</p>
        <button class="submit-report">📤 Kirim Laporan</button>
    </div>
    `;

    chatBody.appendChild(wrapper);
    scrollBottom();

    const submitBtn = wrapper.querySelector(".submit-report");

    submitBtn.addEventListener("click", async () => {

        submitBtn.disabled = true;
        submitBtn.innerText = "Mengirim...";

        try {

            const res = await fetch("http://localhost:3000/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nomor_hp: data.nomor_hp || "",
                    kategori: data.kategori,
                    prioritas: data.prioritas,
                    instansi: data.instansi,
                    ringkasan: data.ringkasan,
                    alasan: data.alasan,
                    saran: data.saran
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Gagal menyimpan laporan.");
            }

            submitBtn.innerText = "✅ Terkirim";

            createMessage(
                "Terima kasih! Laporan Anda sudah kami terima dan akan segera ditindaklanjuti. Anda bisa cek statusnya kapan saja lewat tab Riwayat.",
                "ai"
            );

        } catch (err) {

            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerText = "📤 Kirim Laporan";
            createMessage("❌ Gagal mengirim laporan, coba lagi ya.", "ai");

        }

    });

}

async function sendMessage() {

    const message = messageInput.value.trim();

    if (message === "" && !selectedImage) return;

    createMessage(message, "user");

    messageInput.value = "";

    typing.classList.remove("hidden");

    scrollBottom();

    try {

        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: chatHistory
            })
        });

        const data = await response.json();

        typing.classList.add("hidden");

        console.log(data);

        chatHistory.push({ role: "user", text: message });
        chatHistory.push({ role: "model", text: data.reply || "" });

        if (
            data.type === "chat" ||
            data.type === "question" ||
            data.type === "need_more_info"
        ) {
            createMessage(data.reply, "ai");
            return;
        }

        if (data.type === "complaint" || data.type === "analysis") {
            createMessage(data.reply, "ai");
            createAnalysisCard(data.data || data);
            return;
        }

        if (data.kategori) {
            createAnalysisCard(data);
        } else {
            createMessage(
                data.reply || data.message || "Maaf, saya belum memahami laporan Anda.",
                "ai"
            );
        }

    } catch (err) {

        typing.classList.add("hidden");
        console.error(err);
        createMessage("❌ Gagal terhubung ke server.", "ai");

    }

}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedImage = file;
    previewContainer.classList.remove("hidden");
    previewImage.src = URL.createObjectURL(file);
});

removeImage.addEventListener("click", () => {
    selectedImage = null;
    imageInput.value = "";
    previewContainer.classList.add("hidden");
});

document.querySelectorAll(".quick-action button").forEach(btn => {
    btn.addEventListener("click", () => {
        messageInput.value = btn.innerText;
        messageInput.focus();
    });
});


/* =====================================================
   RIWAYAT (PROGRESS) LOGIC
===================================================== */

const nomorHpInput = document.getElementById("nomorHpInput");
const cekBtn = document.getElementById("cekBtn");
const resultArea = document.getElementById("resultArea");

function formatTanggal(isoString) {
    const d = new Date(isoString.replace(" ", "T"));
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
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
    resultArea.innerHTML = `<div class="loading-state">Memuat riwayat laporan...</div>`;
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

cekBtn.addEventListener("click", cekRiwayat);

nomorHpInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") cekRiwayat();
});


/* =====================================================
   TAB BAR SWITCHING
===================================================== */

const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");

const headerTitle = document.getElementById("headerTitle");
const headerSubtitle = document.getElementById("headerSubtitle");

tabButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        // Toggle active button
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Toggle active view
        const targetId = btn.dataset.tab;
        views.forEach(v => v.classList.toggle("active", v.id === targetId));

        // Update header sesuai tab
        headerTitle.innerText = btn.dataset.title;

        if (btn.dataset.mode === "chat") {
            headerSubtitle.innerHTML = `<span class="online-dot"></span> Online`;
        } else {
            headerSubtitle.innerHTML = `Cek status laporan Anda`;
        }

    });

});
