import React, { useEffect, useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";

function Items() {
  const { items, meta, stats, fetchItems, fetchStats, addItem } = useData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState({ name: "", price: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < (meta?.totalPages || 1), [page, meta]);

  useEffect(() => {
    const controller = new AbortController();
    fetchItems({ q: query, page, pageSize, signal: controller.signal }).catch(
      (err) => {
        if (err.name !== "AbortError") console.error(err);
      },
    );
    return () => {
      controller.abort();
    };
  }, [fetchItems, query, page]);

  useEffect(() => {
    fetchStats().catch(() => {});
  }, [fetchStats]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setPage(1); // reset to first page on new search
  };

  const handlePrev = () => canPrev && setPage((p) => p - 1);
  const handleNext = () => canNext && setPage((p) => p + 1);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addItem({
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category.trim(),
      });
      // Refresh list to include new item on first page
      setPage(1);
      await fetchItems({ q: query, page: 1, pageSize });
      setForm({ name: "", price: "", category: "" });
    } catch (err) {
      setError(err.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = !items.length && (meta?.total ?? 0) === 0;

  if (loading)
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );

  const Row = ({ index, style }) => {
    const item = items[index];
    if (!item) return null;
    return (
      <div
        style={style}
        className="px-3 flex items-center border-b border-slate-100 hover:bg-slate-50"
      >
        <Link
          to={"/items/" + item.id}
          className="text-slate-800 hover:text-indigo-600 font-medium"
        >
          {item.name}
        </Link>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded shadow-sm p-4">
            <p className="text-sm text-slate-600">Total items</p>
            <p className="text-2xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded shadow-sm p-4">
            <p className="text-sm text-slate-600">Average price</p>
            <p className="text-2xl font-semibold text-slate-900">
              ${stats.averagePrice?.toFixed(2)}
            </p>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded shadow-sm p-4 space-y-3"
      >
        <h2 className="text-lg font-semibold text-slate-900">Create Item</h2>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
              className="rounded border border-slate-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600" htmlFor="price">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleFormChange}
              required
              className="rounded border border-slate-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className="rounded border border-slate-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create"}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search items..."
          value={query}
          onChange={handleSearchChange}
          className="w-full rounded border border-slate-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="border border-slate-200 rounded shadow-sm">
        <List height={300} itemCount={items.length} itemSize={50} width="100%">
          {Row}
        </List>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <button
          onClick={handlePrev}
          disabled={!canPrev}
          className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
        >
          Prev
        </button>
        <span className="font-medium text-slate-800">
          Page {meta?.page ?? page} / {meta?.totalPages ?? 1}
        </span>
        <button
          onClick={handleNext}
          disabled={!canNext}
          className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
        <span className="ml-auto">
          Showing {items.length} of {meta?.total ?? items.length} items
        </span>
      </div>
    </div>
  );
}

export default Items;
