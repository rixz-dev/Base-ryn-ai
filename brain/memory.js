const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DIR, 'ryn.db');
let db;

function initMemory() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      role      TEXT NOT NULL,
      content   TEXT NOT NULL,
      timestamp INTEGER DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS facts (
      key     TEXT PRIMARY KEY,
      value   TEXT NOT NULL,
      updated INTEGER DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.prepare("INSERT OR IGNORE INTO state (key, value) VALUES ('mood', 'warm')").run();
  db.prepare("INSERT OR IGNORE INTO state (key, value) VALUES ('chat_id', '')").run();
}

function saveChatId(id) {
  db.prepare("INSERT OR REPLACE INTO state (key, value) VALUES ('chat_id', ?)").run(String(id));
}

function getChatId() {
  const r = db.prepare("SELECT value FROM state WHERE key='chat_id'").get();
  return r?.value ? parseInt(r.value) : null;
}

function saveMessage(role, content) {
  db.prepare("INSERT INTO conversations (role, content) VALUES (?, ?)").run(role, content);
  db.prepare(`
    DELETE FROM conversations
    WHERE id NOT IN (SELECT id FROM conversations ORDER BY id DESC LIMIT 60)
  `).run();
}

function getHistory(limit = 20) {
  return db.prepare(
    "SELECT role, content FROM conversations ORDER BY id DESC LIMIT ?"
  ).all(limit).reverse();
}

function setFact(key, value) {
  db.prepare("INSERT OR REPLACE INTO facts (key, value, updated) VALUES (?, ?, unixepoch())").run(key, value);
}

function getAllFacts() {
  return db.prepare("SELECT key, value FROM facts").all();
}

function getState(key) {
  return db.prepare("SELECT value FROM state WHERE key=?").get(key)?.value;
}

function setState(key, value) {
  db.prepare("INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)").run(key, String(value));
}

function getLastActiveTimestamp() {
  const r = db.prepare("SELECT timestamp FROM conversations ORDER BY id DESC LIMIT 1").get();
  return r?.timestamp || 0;
}

module.exports = {
  initMemory, saveChatId, getChatId,
  saveMessage, getHistory,
  setFact, getAllFacts,
  getState, setState,
  getLastActiveTimestamp,
};