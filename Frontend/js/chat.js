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

/* ======================================== */

function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

/* ======================================== */

function createMessage(text, type = "ai") {

    const wrapper = document.createElement("div");

    wrapper.className = `message ${type}`;

    wrapper.innerHTML = `
        <div class="bubble">
            ${text}
        </div>
    `;

    chatBody.appendChild(wrapper);

    scrollBottom();

}

/* ======================================== */

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

        <button class="submit-report">

            📤 Kirim Laporan

        </button>

    </div>

    `;

    chatBody.appendChild(wrapper);

    scrollBottom();

    // Wire tombol kirim laporan -> simpan ke database lewat /api/progress
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
                "Terima kasih! Laporan Anda sudah kami terima dan akan segera ditindaklanjuti. Anda bisa cek statusnya kapan saja lewat halaman Riwayat Laporan.",
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

/* ======================================== */

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

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                message,

                history: chatHistory

            })

        });

        const data = await response.json();

        typing.classList.add("hidden");

        console.log(data);

        // Simpan giliran ini ke history supaya konteks (lokasi, jenis masalah,
        // dst yang sudah disebutkan warga) tidak hilang di request berikutnya.
        chatHistory.push({ role: "user", text: message });
        chatHistory.push({ role: "model", text: data.reply || "" });

        /*
        ===============================
        CHAT BIASA / MASIH ADA DATA KURANG
        ===============================
        */

        if (
            data.type === "chat" ||
            data.type === "question" ||
            data.type === "need_more_info"
        ) {

            createMessage(data.reply, "ai");

            return;

        }

        /*
        ===============================
        ADUAN LENGKAP -> TAMPILKAN RINGKASAN
        ===============================
        */

        if (data.type === "complaint" || data.type === "analysis") {

            createMessage(data.reply, "ai");

            // Skema baru backend: field flat langsung di root object.
            // Skema lama (kalau masih ada): nested di data.data.
            createAnalysisCard(data.data || data);

            return;

        }

        /*
        ===============================
        BACKWARD COMPATIBILITY
        (Backend lama tanpa field "type")
        ===============================
        */

        if (data.kategori) {

            createAnalysisCard(data);

        } else {

            createMessage(

                data.reply ||
                data.message ||
                "Maaf, saya belum memahami laporan Anda.",

                "ai"

            );

        }

    }

    catch (err) {

        typing.classList.add("hidden");

        console.error(err);

        createMessage(

            "❌ Gagal terhubung ke server.",

            "ai"

        );

    }

}

/* ======================================== */

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {

    if (e.key === "Enter") {

        sendMessage();

    }

});

/* ======================================== */

imageInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    selectedImage = file;

    previewContainer.classList.remove("hidden");

    previewImage.src = URL.createObjectURL(file);

});

/* ======================================== */

removeImage.addEventListener("click", () => {

    selectedImage = null;

    imageInput.value = "";

    previewContainer.classList.add("hidden");

});

/* ======================================== */

document.querySelectorAll(".quick-action button").forEach(btn => {

    btn.addEventListener("click", () => {

        messageInput.value = btn.innerText;

        messageInput.focus();

    });

});