const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
// Allow overriding for tests; default to repo data file
const DATA_PATH =
  process.env.DATA_PATH || path.join(__dirname, "../../../data/items.json");

const fsp = fs.promises;
let cachedStats = null;
let cachedMtime = 0;
let inflight = null;

async function computeStats() {
  const raw = await fsp.readFile(DATA_PATH, "utf8");
  const items = JSON.parse(raw);
  const total = items.length;
  const averagePrice = total
    ? items.reduce((acc, cur) => acc + cur.price, 0) / total
    : 0;
  return { total, averagePrice };
}

// Calculate stats only when underlying data file changes; share inflight work between requests
async function getStats() {
  if (inflight) return inflight;
  inflight = (async () => {
    const { mtimeMs } = await fsp.stat(DATA_PATH);
    if (cachedStats && cachedMtime === mtimeMs) return cachedStats;
    const stats = await computeStats();
    cachedStats = stats;
    cachedMtime = mtimeMs;
    return stats;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

// GET /api/stats
router.get("/", async (req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
