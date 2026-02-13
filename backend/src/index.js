const express = require("express");
const morgan = require("morgan");
const itemsRouter = require("./routes/items");
const statsRouter = require("./routes/stats");
const cors = require("cors");
const {
  getCookie,
  notFound,
  generalError,
} = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));
// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/items", itemsRouter);
app.use("/api/stats", statsRouter);

// Not Found
app.use("*", notFound);
// Error handler (must be after routes)
app.use(generalError);
// Skip external call during tests
if (process.env.NODE_ENV !== "test") {
  getCookie();
}

// Start server only when run directly, so tests can import the app without binding a port
if (require.main === module) {
  app.listen(port, () =>
    console.log("Backend running on http://localhost:" + port),
  );
}

module.exports = app;
