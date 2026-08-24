import express from "express";
import {
    createReport,
    listReports,
    getReportsByPhone,
    updateReportStatus
} from "../firebase.js";

const router = express.Router();

/* ========================================
   POST /api/progress
   Simpan laporan baru (dipanggil saat warga
   klik tombol "Kirim Laporan" di chat)
======================================== */
router.post("/", async (req, res) => {
    try {
        const {
            nomor_hp,
            kategori,
            prioritas,
            instansi,
            ringkasan,
            alasan,
            saran
        } = req.body;

        if (!nomor_hp) {
            return res.status(400).json({
                error: "Nomor HP wajib diisi untuk menyimpan laporan."
            });
        }

        const laporan = await createReport({
            nomor_hp,
            kategori,
            prioritas,
            instansi,
            ringkasan,
            alasan,
            saran
        });

        res.status(201).json({ success: true, laporan });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* ========================================
   GET /api/progress
   Ambil semua laporan untuk admin dashboard.
======================================== */
router.get("/", async (req, res) => {
    try {
        const rows = await listReports();
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* ========================================
   GET /api/progress/:nomor_hp
   Ambil semua riwayat laporan milik nomor HP tertentu,
   diurutkan dari yang paling baru.
======================================== */
router.get("/:nomor_hp", async (req, res) => {
    try {
        const { nomor_hp } = req.params;
        const rows = await getReportsByPhone(nomor_hp);

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* ========================================
   PATCH /api/progress/:id/status
   Update status laporan (dipakai petugas di admin.html)
   Body: { status: "Menunggu" | "Diproses" | "Selesai" }
======================================== */
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ["Menunggu", "Diproses", "Selesai"];

        if (!validStatus.includes(status)) {
            return res.status(400).json({
                error: `Status harus salah satu dari: ${validStatus.join(", ")}`
            });
        }

        const laporan = await updateReportStatus(id, status);

        res.json({ success: true, laporan });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
