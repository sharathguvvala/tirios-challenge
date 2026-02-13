import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setItem(null);

    fetch(`${API_BASE}/api/items/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setError('Item not found');
      });

    return () => {
      cancelled = true;
    };
  }, [API_BASE, id]);

  if (!item && !error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-4">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">
            &larr; Back to list
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
          <p className="text-slate-800 font-semibold mb-2">{error}</p>
          <p className="text-slate-600">The item you requested does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">&larr; Back to list</Link>
      </div>
      <div className="bg-white rounded shadow-sm border border-slate-200 p-6 space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>
        <p className="text-sm text-slate-600">ID: {item.id}</p>
        {item.category && (
          <p className="text-slate-700">
            <span className="font-semibold">Category:</span> {item.category}
          </p>
        )}
        <p className="text-slate-700">
          <span className="font-semibold">Price:</span> ${item.price}
        </p>
        {item.description && (
          <p className="text-slate-700">{item.description}</p>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
