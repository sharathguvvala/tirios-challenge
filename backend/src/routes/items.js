const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();
// Allow overriding data path for tests via DATA_PATH env; fall back to repo data file
const DATA_PATH =
  process.env.DATA_PATH || path.join(__dirname, "../../../data/items.json");

// Helper function to read data without blocking the event loop
async function readData() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

// GET /api/items with pagination + search
router.get("/", async (req, res, next) => {
  try {
    const data = await readData();
    const { q, page = 1, pageSize = 10, limit } = req.query;
    let results = data;

    if (q) {
      const term = String(q).toLowerCase();
      results = results.filter((item) =>
        item.name.toLowerCase().includes(term),
      );
    }

    // Backward compatibility: limit maps to first page of size=limit
    const size = limit ? parseInt(limit, 10) : parseInt(pageSize, 10) || 10;
    const pageNum = limit ? 1 : parseInt(page, 10) || 1;
    const safePage = Math.max(pageNum, 1);
    const safeSize = Math.max(size, 1);

    const total = results.length;
    const totalPages = Math.max(Math.ceil(total / safeSize), 1);
    const start = (safePage - 1) * safeSize;
    const paged = results.slice(start, start + safeSize);

    res.json({
      items: paged,
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find((i) => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error("Item not found");
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post("/", async (req, res, next) => {
  try {
    const item = req.body;
    const errors = [];
    if (!item || typeof item !== "object") {
      errors.push("Body must be a JSON object");
    }
    if (!item?.name || typeof item.name !== "string" || !item.name.trim()) {
      errors.push("Field 'name' is required and must be a non-empty string");
    }
    if (
      item?.price === undefined ||
      typeof item.price !== "number" ||
      Number.isNaN(item.price)
    ) {
      errors.push("Field 'price' is required and must be a number");
    }
    if (item?.category && typeof item.category !== "string") {
      errors.push("Field 'category' must be a string if provided");
    }
    if (errors.length) {
      const err = new Error(errors.join("; "));
      err.status = 400;
      throw err;
    }
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
