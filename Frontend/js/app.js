
const chatBody = document.getElementById("chatBody");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");

const typing = document.getElementById("typing");

let selectedImage = null;

let chatHistory = [];

function scrollBottom() {
    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
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
        <h3>Ringkasan Laporan</h3>
        <hr>
        <p><b>Kategori</b><br>${data.kategori}</p>
        <p><b>Prioritas</b><br>${data.prioritas}</p>
        <p><b>Instansi</b><br>${data.instansi}</p>
        <p><b>Ringkasan</b><br>${data.ringkasan}</p>
        <p><b>Alasan</b><br>${data.alasan}</p>
        <p><b>Saran</b><br>${data.saran}</p>
        <button class="submit-report">
        <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.2em;">send</span> Kirim Laporan
        </button>
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

            submitBtn.innerText = "Terkirim";

            createMessage(
                "Terima kasih! Laporan Anda sudah kami terima dan akan segera ditindaklanjuti. Anda bisa cek statusnya kapan saja lewat tombol Riwayat di bawah chat.",
                "ai"
            );

        } catch (err) {

            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerText = "Kirim Laporan";
            createMessage('<span class="material-symbols-outlined" style="vertical-align: middle; color: #d32f2f;">error</span> Gagal mengirim laporan, coba lagi ya.', "ai");

        }

    });

}

async function sendMessage() {

    const message = messageInput.value.trim();

    if (message === "" && !selectedImage) return;

    createMessage(message, "user");

    messageInput.value = "";

    chatBody.appendChild(typing);
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
        messageInput.value = btn.dataset.prompt;
        messageInput.focus();
    });
});

const quickActionToggle = document.getElementById("quickActionToggle");
const quickActionList = document.querySelector(".quick-action");

quickActionToggle.addEventListener("click", () => {
    const isExpanded = quickActionToggle.getAttribute("aria-expanded") === "true";
    quickActionToggle.setAttribute("aria-expanded", String(!isExpanded));
    quickActionList.classList.toggle("is-collapsed", isExpanded);
    quickActionList.inert = isExpanded;
    quickActionList.setAttribute("aria-hidden", String(isExpanded));
    quickActionToggle.lastChild.textContent = isExpanded
        ? "Tampilkan pertanyaan cepat"
        : "Sembunyikan pertanyaan cepat";
});

document.querySelectorAll(".composer-shortcuts [data-prompt]").forEach(btn => {
    btn.addEventListener("click", () => {
        messageInput.value = btn.dataset.prompt;
        messageInput.focus();
    });
});


let historyLookupCard;

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTanggal(isoString) {
    const d = new Date(String(isoString || "").replace(" ", "T"));
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

function renderList(laporanList) {

    if (laporanList.length === 0) {
        historyLookupCard.querySelector(".history-results").innerHTML = `
            <div class="history-empty">
                <span class="material-symbols-outlined" aria-hidden="true">inbox</span>
                <p>Belum ada laporan yang tercatat untuk nomor HP ini.</p>
            </div>
        `;
        scrollBottom();
        return;
    }

    const cards = laporanList.map(item => `
        <div class="laporan-card">
            <div class="laporan-card-top">
                <div class="laporan-kategori">${escapeHtml(item.kategori || "Tanpa kategori")}</div>
                <div class="laporan-tanggal">${escapeHtml(formatTanggal(item.created_at) || "-")}</div>
            </div>
            <div class="laporan-ringkasan">${escapeHtml(item.ringkasan || "-")}</div>
            <div class="badge-row">
                <span class="badge ${statusClass(item.status)}">${escapeHtml(item.status || "Menunggu")}</span>
                <span class="badge ${prioritasClass(item.prioritas)}">Prioritas ${escapeHtml(item.prioritas || "-")}</span>
            </div>
        </div>
    `).join("");

    historyLookupCard.querySelector(".history-results").innerHTML = `<div class="laporan-list">${cards}</div>`;
    scrollBottom();
}

function renderHistoryMessage(text, type = "info") {
    historyLookupCard.querySelector(".history-results").innerHTML = `<p class="history-message ${type}">${escapeHtml(text)}</p>`;
    scrollBottom();
}

async function cekRiwayat() {
    const nomorHpInput = historyLookupCard.querySelector(".history-phone");
    const cekBtn = historyLookupCard.querySelector(".history-submit");
    const nomorHp = nomorHpInput.value.trim();
    if (nomorHp === "") {
        renderHistoryMessage("Masukkan nomor HP terlebih dahulu.", "error");
        nomorHpInput.focus();
        return;
    }

    cekBtn.disabled = true;
    renderHistoryMessage("Memuat riwayat laporan...");

    try {

        const res = await fetch(`http://localhost:3000/api/progress/${encodeURIComponent(nomorHp)}`);
        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || "Gagal mengambil data.");
        }

        renderList(result.data || []);

    } catch (err) {

        console.error(err);
        renderHistoryMessage("Gagal memuat riwayat. Pastikan koneksi Anda stabil dan coba lagi.", "error");

    } finally {

        cekBtn.disabled = false;

    }
}

function openHistoryLookup() {
    if (historyLookupCard) {
        historyLookupCard.scrollIntoView({ behavior: "instant", block: "nearest" });
        historyLookupCard.querySelector(".history-phone").focus();
        return;
    }

    historyLookupCard = document.createElement("div");
    historyLookupCard.className = "message ai history-lookup";
    historyLookupCard.innerHTML = `
        <div class="bubble history-lookup-bubble">
            <div class="history-lookup-heading">
                <span class="material-symbols-outlined" aria-hidden="true">history</span>
                <div>
                    <h3>Cek status laporan</h3>
                    <p>Masukkan nomor HP yang digunakan saat membuat laporan.</p>
                </div>
            </div>
            <form class="history-search">
                <label class="sr-only" for="historyPhoneInput">Nomor HP pelapor</label>
                <input class="history-phone" id="historyPhoneInput" type="tel" placeholder="Contoh: 081234567890" autocomplete="tel">
                <button class="history-submit" type="submit">
                    <span class="material-symbols-outlined" aria-hidden="true">search</span>
                    Cari
                </button>
            </form>
            <div class="history-results" aria-live="polite">
                <p class="history-message">Riwayat laporan Anda akan muncul di sini.</p>
            </div>
        </div>
    `;

    chatBody.appendChild(historyLookupCard);
    historyLookupCard.querySelector(".history-search").addEventListener("submit", event => {
        event.preventDefault();
        cekRiwayat();
    });
    historyLookupCard.querySelector(".history-phone").focus({ preventScroll: true });
    scrollBottom();
}

document.querySelectorAll(".composer-shortcuts [data-action='history']").forEach(btn => {
    btn.addEventListener("click", openHistoryLookup);
});
