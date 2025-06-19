// backend/server.js

// 1) Load environment variables (must have GOOGLE_PLACES_API_KEY in backend/.env)
require("dotenv").config();
console.log("🔑 GOOGLE_PLACES_API_KEY =", process.env.GOOGLE_PLACES_API_KEY);

// 2) Catch any uncaught exceptions or promise rejections
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

const express = require("express");
const cors    = require("cors");
const axios   = require("axios");
const { saveUserData, getUserData } = require("./utils/userStore");

const app = express();

// 3) Middleware
app.use(cors());
app.use(express.json());

// 4) Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ← ${req.method} ${req.url}`);
  next();
});

// 5) User‐memory routes

// Fetch stored preferences for a user
app.get("/api/user/:userId", (req, res) => {
  const data = getUserData(req.params.userId);
  res.json(data);
});

// Save or update preferences for a user
app.post("/api/user/:userId", (req, res) => {
  saveUserData(req.params.userId, req.body);
  res.sendStatus(204);
});

// 6) Real‐world restaurant lookup

app.get("/api/restaurants", async (req, res, next) => {
  try {
    const { lat, lon, cuisine } = req.query;
    if (!lat || !lon || !cuisine) {
      return res.status(400).json({ error: "lat, lon & cuisine required" });
    }

    // First, try Nearby Search with type=restaurant & keyword
    const nearby = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            key: process.env.GOOGLE_PLACES_API_KEY,
            location: `${lat},${lon}`,
            radius: 10000,                   // 10 km
            type:    "restaurant",
            keyword: `${cuisine} restaurant`,
          },
        }
    );

    console.log(
        `🔍 NearbySearch status=${nearby.data.status}, found ${nearby.data.results.length}`
    );

    let places = nearby.data.results;

    // Fallback to Text Search if no results
    if (!places || places.length === 0) {
      console.log("ℹ️ Falling back to Text Search for", cuisine);
      const text = await axios.get(
          "https://maps.googleapis.com/maps/api/place/textsearch/json",
          {
            params: {
              key:    process.env.GOOGLE_PLACES_API_KEY,
              query:  `${cuisine} restaurant`,
              location: `${lat},${lon}`,
              radius: 10000,
            },
          }
      );
      console.log(
          `🔍 TextSearch status=${text.data.status}, found ${text.data.results.length}`
      );
      places = text.data.results;
    }

    // Map top 3 results
    const top3 = (places || [])
        .slice(0, 3)
        .map((r) => ({
          name:    r.name,
          rating:  r.rating?.toFixed(1) || "?",
          address: r.vicinity || r.formatted_address || "",
        }));

    // If still no results, send a friendly message
    if (top3.length === 0) {
      return res.json([
        {
          name:    `No ${cuisine} spots found nearby.`,
          rating:  "-",
          address: "",
        },
      ]);
    }

    res.json(top3);
  } catch (err) {
    next(err);
  }
});

// 7) 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 8) Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 9) Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🗄️  Backend listening on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});

// 10) Keep Node alive (for certain environments)
process.stdin.resume();
