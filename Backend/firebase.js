import db from "./db.js";

function nowString() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizeReport(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id
  };
}

export async function createReport(input) {
  const now = nowString();
  const stmt = db.prepare(`
    INSERT INTO laporan (
      nomor_hp,
      kategori,
      prioritas,
      instansi,
      ringkasan,
      alasan,
      saran,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.nomor_hp || "",
    input.kategori || "",
    input.prioritas || "",
    input.instansi || "",
    input.ringkasan || "",
    input.alasan || "",
    input.saran || "",
    "Menunggu",
    now,
    now
  );

  return {
    id: result.lastInsertRowid,
    nomor_hp: input.nomor_hp || "",
    kategori: input.kategori || "",
    prioritas: input.prioritas || "",
    instansi: input.instansi || "",
    ringkasan: input.ringkasan || "",
    alasan: input.alasan || "",
    saran: input.saran || "",
    status: "Menunggu",
    created_at: now,
    updated_at: now
  };
}

export async function listReports() {
  const rows = db.prepare(`
    SELECT * FROM laporan
    ORDER BY created_at DESC, id DESC
  `).all();

  return rows.map(normalizeReport);
}

export async function getReportsByPhone(nomorHp) {
  const rows = db.prepare(`
    SELECT * FROM laporan
    WHERE nomor_hp = ?
    ORDER BY created_at DESC, id DESC
  `).all(nomorHp);

  return rows.map(normalizeReport);
}

export async function updateReportStatus(id, status) {
  const updatedAt = nowString();
  const stmt = db.prepare(`
    UPDATE laporan
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = stmt.run(status, updatedAt, id);

  if (result.changes === 0) {
    throw new Error("Laporan tidak ditemukan.");
  }

  const row = db.prepare(`SELECT * FROM laporan WHERE id = ?`).get(id);
  return normalizeReport(row);
}
