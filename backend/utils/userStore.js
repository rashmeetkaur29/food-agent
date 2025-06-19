const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/userData.json');

// Ensure file exists
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, '{}');
}

// Save user preferences
function saveUserData(userId, data) {
  let store = JSON.parse(fs.readFileSync(FILE_PATH));
  store[userId] = { ...(store[userId] || {}), ...data };
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2));
}

// Get user preferences
function getUserData(userId) {
  let store = JSON.parse(fs.readFileSync(FILE_PATH));
  return store[userId] || null;
}

module.exports = { saveUserData, getUserData };
