// backend/utils/userStore.js
const fs   = require("fs");
const path = require("path");

// Resolve the path to backend/data/userData.json
const FILE_PATH = path.resolve(__dirname, "../data/userData.json");

// Bootstrap: create data folder + file if missing
try {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "{}", "utf-8");
} catch (err) {
  console.error("❌ Could not bootstrap userData.json:", err);
}

function readStore() {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Error reading userData.json:", err);
    return {};
  }
}

function writeStore(store) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
    console.log("✅ userData.json updated");
  } catch (err) {
    console.error("❌ Error writing userData.json:", err);
  }
}

function saveUserData(userId, newData) {
  console.log(`💾 Saving data for ${userId}:`, newData);
  const store = readStore();
  store[userId] = { ...(store[userId] || {}), ...newData };
  writeStore(store);
}

function getUserData(userId) {
  const store = readStore();
  return store[userId] || {};
}

module.exports = { saveUserData, getUserData };
