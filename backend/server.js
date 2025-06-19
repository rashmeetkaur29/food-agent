const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { saveUserData, getUserData } = require('./utils/userStore');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Test route to save user data
app.post('/api/save', (req, res) => {
  const { userId, preferences } = req.body;

  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Missing userId or preferences' });
  }

  saveUserData(userId, preferences);
  const stored = getUserData(userId);
  res.json({ message: 'Saved', data: stored });
});

// Test route to fetch user data
app.get('/api/user/:userId', (req, res) => {
  const data = getUserData(req.params.userId);
  if (!data) return res.status(404).json({ error: 'No data found' });
  res.json(data);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
