import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, "sigap.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS laporan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_hp TEXT NOT NULL,
    kategori TEXT,
    prioritas TEXT,
    instansi TEXT,
    ringkasan TEXT,
    alasan TEXT,
    saran TEXT,
    status TEXT NOT NULL DEFAULT 'Menunggu',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

export default db;
