const request = require("supertest");
const fs = require("fs").promises;
const path = require("path");

const ITEMS = [
  { id: 1, name: "Alpha", price: 10 },
  { id: 2, name: "Beta", price: 20 },
];

const TEST_DATA_PATH = path.join(__dirname, "../../data/items-test.json");

async function resetItems() {
  await fs.writeFile(TEST_DATA_PATH, JSON.stringify(ITEMS, null, 2));
}

describe("items routes", () => {
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetItems();
  });

  beforeEach(async () => {
    process.env.DATA_PATH = TEST_DATA_PATH;
    await resetItems();
    delete require.cache[require.resolve("../src/routes/items")];
    delete require.cache[require.resolve("../src/index")];
    app = require("../src/index");
  });

  afterAll(async () => {
    delete process.env.DATA_PATH;
  });

  test("GET /api/items returns all items", async () => {
    const res = await request(app).get("/api/items").expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].name).toBe("Alpha");
  });

  test("GET /api/items supports search via q", async () => {
    const res = await request(app).get("/api/items?q=be").expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(2);
  });

  test("GET /api/items/:id returns item when present", async () => {
    const res = await request(app).get("/api/items/1").expect(200);
    expect(res.body).toMatchObject({ id: 1, name: "Alpha" });
  });

  test("GET /api/items/:id returns 404 for missing item", async () => {
    const res = await request(app).get("/api/items/999").expect(404);
    expect(res.body.message || res.body.error || res.text).toBeDefined();
  });

  test("POST /api/items creates and persists item", async () => {
    const newItem = { name: "Gamma", price: 30 };
    const res = await request(app)
      .post("/api/items")
      .send(newItem)
      .expect(201);

    expect(res.body).toMatchObject({ name: "Gamma", price: 30 });
    expect(res.body.id).toBeDefined();

    const raw = await fs.readFile(TEST_DATA_PATH, "utf8");
    const saved = JSON.parse(raw);
    const created = saved.find((i) => i.name === "Gamma");
    expect(created).toBeTruthy();
  });
});
