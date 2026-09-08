/**
 * Logging — mirrors backend/server/config/logging.py.
 *
 * Writes to the console and to logs/herbchain.log (used by the admin
 * `GET /admin/api/logs` endpoint, same as Flask).
 */
const fs = require("fs");
const path = require("path");
const { env } = require("./env");

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOGS_DIR, "herbchain.log");

const LEVELS = { DEBUG: 10, INFO: 20, WARNING: 30, ERROR: 40 };
const level = LEVELS[env.LOG_LEVEL] ?? LEVELS.INFO;

function ensureLogFile() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function log(levelName, name, message) {
  if (LEVELS[levelName] < level) return;
  const line = `${new Date().toISOString()} - ${name} - ${levelName} - ${message}`;
  // eslint-disable-next-line no-console
  console[levelName === "ERROR" ? "error" : "log"](line);
  try {
    ensureLogFile();
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // never let logging break the request
  }
}

function getLogger(name) {
  return {
    debug: (msg) => log("DEBUG", name, msg),
    info: (msg) => log("INFO", name, msg),
    warn: (msg) => log("WARNING", name, msg),
    error: (msg) => log("ERROR", name, msg),
  };
}

module.exports = { getLogger };