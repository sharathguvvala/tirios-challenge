import React, { createContext, useCallback, useContext, useState } from "react";

const DataContext = createContext();
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [stats, setStats] = useState(null);

  const fetchItems = useCallback(
    async ({ q = "", page = 1, pageSize = 10, signal } = {}) => {
      const params = new URLSearchParams({ page, pageSize });
      if (q) params.append("q", q);
      const res = await fetch(`${API_BASE}/api/items?${params.toString()}`, {
        signal,
      });
      const json = await res.json();
      // json expected: { items, total, page, pageSize, totalPages }
      if (json.items) {
        setItems(json.items);
        setMeta({
          total: json.total,
          page: json.page,
          pageSize: json.pageSize,
          totalPages: json.totalPages,
        });
      } else {
        // fallback for legacy response
        setItems(json);
        setMeta((prev) => ({ ...prev, total: json.length }));
      }
    },
    [],
  );

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error("Failed to load stats");
    const json = await res.json();
    setStats(json);
    console.log(json);
    return json;
  }, []);

  const addItem = useCallback(async ({ name, price, category }) => {
    const payload = { name, price, category };
    const res = await fetch(`${API_BASE}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = (await res.json()).message || "Failed to create item";
      throw new Error(message);
    }
    return res.json();
  }, []);

  return (
    <DataContext.Provider
      value={{ items, meta, stats, fetchItems, fetchStats, addItem }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
