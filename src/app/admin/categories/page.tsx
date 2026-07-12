"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function loadCategories() {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }

  useEffect(loadCategories, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, sortOrder: categories.length }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : JSON.stringify(d.error));
      return;
    }
    setName("");
    loadCategories();
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Yakin hapus kategori "${catName}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    loadCategories();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadCategories();
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    const slug = editName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, slug }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    setEditingId(null);
    loadCategories();
  }

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">← Dashboard Admin</Link>
        </div>

        <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-8">
          <span className="bg-[var(--neo-accent)] px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">🏷️</span>
          Kelola Kategori Produk
        </h1>

        {/* Add form */}
        <div className="neo-card p-6 mb-8">
          <h2 className="font-extrabold text-lg mb-4">Tambah Kategori Baru</h2>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kategori (contoh: Elektronik)"
              className="neo-input flex-1"
            />
            <button disabled={loading} className="neo-btn neo-btn-primary whitespace-nowrap">
              {loading ? "⏳" : "+ Tambah"}
            </button>
          </form>
          {error && (
            <p className="mt-3 text-sm font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">❌ {error}</p>
          )}
        </div>

        {/* Category list */}
        <div className="neo-card overflow-hidden">
          <div className="p-4 border-b-[3px] border-dashed border-[var(--neo-black)]/20 flex justify-between items-center">
            <h2 className="font-extrabold">Daftar Kategori ({categories.length})</h2>
          </div>
          {categories.length === 0 ? (
            <div className="p-10 text-center opacity-50">
              <div className="text-4xl mb-2">🏷️</div>
              <p className="font-bold">Belum ada kategori</p>
            </div>
          ) : (
            <div className="divide-y divide-dashed divide-[var(--neo-black)]/10">
              {categories.map((c, i) => (
                <div key={c.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${i % 2 === 0 ? "bg-white/50" : ""}`}>
                  {/* Icon & name */}
                  <div className="flex items-center gap-3 flex-grow">
                    <span className="w-8 h-8 rounded-lg border-[2px] border-[var(--neo-black)] bg-[var(--neo-accent)] flex items-center justify-center text-lg font-extrabold shadow-[2px_2px_0px_var(--neo-black)]">
                      {c.iconUrl ? "🖼️" : c.name.charAt(0).toUpperCase()}
                    </span>
                    {editingId === c.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="neo-input text-sm flex-1"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(c.id)} className="neo-btn bg-[var(--neo-green)] text-xs px-3">✓</button>
                        <button onClick={() => setEditingId(null)} className="neo-btn bg-gray-200 text-xs px-3">✕</button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-extrabold">{c.name}</p>
                        <p className="text-xs font-mono opacity-50">{c.slug}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(c.id, c.isActive)}
                      className={`text-xs px-3 py-1.5 font-bold border-[2px] border-[var(--neo-black)] rounded-full shadow-[1px_1px_0px_var(--neo-black)] transition-colors ${
                        c.isActive ? "bg-[var(--neo-green)]" : "bg-gray-200 opacity-60"
                      }`}
                    >
                      {c.isActive ? "✅ Aktif" : "⏸ Nonaktif"}
                    </button>
                    <button
                      onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                      className="neo-btn bg-[var(--neo-accent)] text-xs px-3 py-1.5"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="neo-btn bg-[var(--neo-pink)] text-white text-xs px-3 py-1.5"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
