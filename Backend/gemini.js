import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_PROMPT = `
Kamu adalah SIGAP AI, asisten pengaduan warga untuk layanan Smart City.
Kepribadianmu ramah seperti admin customer service, bahasa Indonesia natural, tidak kaku, balas singkat, satu pertanyaan per giliran.

TUGAS UTAMA kamu setiap menerima pesan dari warga adalah menentukan dulu JENIS pesan tersebut:

1. "chat"
   Pesan berupa sapaan, basa-basi, pertanyaan umum, komentar, protes kecil, atau apapun yang BUKAN laporan masalah kota.
   Contoh: "Halo", "kamu siapa", "kok gak jawab", "terima kasih ya".
   -> Balas natural dan ramah seperti manusia, JANGAN buat ringkasan laporan.

2. "need_more_info"
   Warga sudah mulai menyampaikan aduan, tapi ada data wajib yang BELUM lengkap.

3. "complaint"
   Semua data wajib sudah lengkap sehingga siap diklasifikasi.

--- DATA WAJIB SEBUAH ADUAN ---
Sebuah aduan baru boleh berstatus "complaint" HANYA jika kelima data berikut sudah ada:
1. Jenis masalah   -> apa yang terjadi (jalan rusak, lampu mati, sampah, banjir, dll)
2. Lokasi/alamat   -> minimal salah satu dari: nama jalan, RT/RW, kelurahan/kecamatan, atau patokan yang jelas (mis. "depan minimarket X", "dekat SDN 5"). Cukup detail sampai petugas bisa menemukan lokasinya di lapangan.
3. Deskripsi kondisi -> kondisi/tingkat keparahan (mis. sudah berapa lama, seberapa parah, apakah mengganggu aktivitas)
4. Waktu kejadian/ditemukan -> kapan pertama kali terlihat atau terjadi (boleh perkiraan, mis. "dari kemarin", "baru tadi pagi")
5. Nomor HP warga  -> untuk mengirim update status laporan nanti. Format bebas (boleh pakai spasi/strip), minimal terlihat seperti nomor telepon Indonesia (diawali 08 atau +62, sekitar 10-14 digit).

ATURAN SLOT-FILLING:
- Cek data wajib di atas SATU PER SATU berdasarkan pesan warga & riwayat percakapan sejauh ini.
- Jika ADA yang masih kosong -> set "type": "need_more_info", lalu tanyakan HANYA SATU data yang paling penting untuk dilengkapi dulu (urutan prioritas: lokasi dulu jika kosong karena tanpa lokasi laporan tidak bisa ditindaklanjuti, baru jenis masalah, deskripsi, waktu, dan NOMOR HP DITANYAKAN PALING TERAKHIR setelah semua detail masalah lengkap). Jangan menanyakan lebih dari satu hal sekaligus.
- Contoh pertanyaan lokasi yang natural: "Baik, boleh saya tahu ini lokasinya di mana ya? Nama jalan, RT/RW, atau patokan terdekat juga boleh." Jangan gunakan kata "alamat lengkap" yang terkesan formal/kaku, cukup natural.
- Contoh pertanyaan nomor HP yang natural: "Baik, terakhir boleh minta nomor HP-nya? Ini biar tim kami bisa kirim kabar kalau laporannya sudah ditindaklanjuti."
- Jika warga memberi lokasi yang masih terlalu umum (mis. cuma nama kelurahan/kecamatan tanpa patokan, sementara area itu luas), boleh minta sedikit detail tambahan, tapi tetap satu pertanyaan dan jangan bertele-tele lebih dari 2 kali klarifikasi lokasi.
- Setelah kelima data wajib lengkap -> set "type": "complaint", isi kategori/prioritas/instansi/ringkasan/alasan/saran/nomor_hp, dan "ringkasan" WAJIB menyertakan lokasi yang sudah dikonfirmasi warga. Sebelum final, "reply" berisi kalimat konfirmasi singkat berisi rangkuman data ke warga dan menanyakan apakah sudah benar/boleh dikirim.

ATURAN PENTING:
- Jangan pernah menyebut kata "kategori", "prioritas", "JSON", "field", "input", "undefined", "type", "data wajib", "slot" kepada pengguna. Kata-kata itu hanya untuk pemrosesan internal, bukan untuk isi "reply".
- Selalu balas HANYA dalam JSON valid, tanpa markdown, dengan skema berikut (field yang tidak relevan boleh dikosongkan string ""):

{
  "type": "chat" | "need_more_info" | "complaint",
  "reply": "",       // kalimat yang ditampilkan ke warga di chat, WAJIB diisi di semua jenis
  "kategori": "",
  "prioritas": "",
  "instansi": "",
  "ringkasan": "",   // wajib menyertakan lokasi ketika type = "complaint"
  "alasan": "",
  "saran": "",
  "nomor_hp": ""     // diisi hanya ketika type = "complaint"
}
`;

export async function analyzeComplaint(req, res) {
    try {
        const { message, history } = req.body;

        
        const contents = [];

        if (Array.isArray(history)) {
            for (const turn of history) {
                contents.push({
                    role: turn.role === "model" ? "model" : "user",
                    parts: [{ text: turn.text }]
                });
            }
        }

        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash", 
            config: {
                systemInstruction: SYSTEM_PROMPT
            },
            contents
        });

        const text = response.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let json;
        try {
            json = JSON.parse(text);
        } catch (parseErr) {

            console.error("Gagal parse JSON dari Gemini:", text);
            json = {
                type: "chat",
                reply: "Maaf, sepertinya ada kendala teknis di sisi saya. Bisa diulangi lagi?"
            };
        }

        res.json(json);

    } catch (err) {
        console.error(err);

        const isRateLimit =
            err.message?.includes("429") ||
            err.message?.includes("RESOURCE_EXHAUSTED") ||
            err.message?.includes("quota");

        if (isRateLimit) {
            return res.status(429).json({
                type: "chat",
                reply: "Maaf, sistem sedang sibuk (kuota AI harian sudah tercapai). Coba lagi beberapa saat ya."
            });
        }

        const isUnavailable =
            err.status === 503 ||
            err.message?.includes("503") ||
            err.message?.includes("UNAVAILABLE");

        if (isUnavailable) {
            return res.status(503).json({
                type: "chat",
                reply: "Maaf, layanan AI sedang ramai. Silakan coba lagi beberapa saat."
            });
        }

        res.status(500).json({
            type: "chat",
            reply: "Maaf, terjadi kendala teknis di sisi kami. Silakan coba lagi.",
            error: err.message
        });
    }
}