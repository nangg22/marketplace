"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: { before?: any; after?: any } | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  "admin.user.banned": "🚫 User di-ban",
  "admin.user.unbanned": "✅ User di-unban",
  "admin.user.role_changed": "🔄 Role diubah",
  "admin.user.deleted": "🗑️ User dihapus",
  "admin.product.suspended": "⏸️ Produk di-suspend",
  "admin.product.unsuspended": "▶️ Produk di-unsuspend",
  "admin.product.deleted": "🗑️ Produk dihapus",
  "admin.transaction.status_updated": "🔃 Status transaksi diubah",
  "admin.transaction.refunded": "💸 Transaksi di-refund",
  "admin.category.created": "🏷️ Kategori dibuat",
  "admin.category.updated": "✏️ Kategori diupdate",
  "admin.category.deleted": "🗑️ Kategori dihapus",
};

const ACTION_COLORS: Record<string, string> = {
  "admin.user.banned": "bg-red-200 text-red-900",
  "admin.user.unbanned": "bg-green-200 text-green-900",
  "admin.user.role_changed": "bg-blue-200 text-blue-900",
  "admin.user.deleted": "bg-red-300 text-red-900",
  "admin.product.suspended": "bg-yellow-200 text-yellow-900",
  "admin.product.unsuspended": "bg-green-200 text-green-900",
  "admin.product.deleted": "bg-red-200 text-red-900",
  "admin.transaction.status_updated": "bg-purple-200 text-purple-900",
  "admin.transaction.refunded": "bg-pink-200 text-pink-900",
  "admin.category.created": "bg-teal-200 text-teal-900",
  "admin.category.updated": "bg-teal-100 text-teal-900",
  "admin.category.deleted": "bg-red-200 text-red-900",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => res.json())
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); });
  }, [actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">← Dashboard Admin</Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">📋</span>
              Riwayat Aktivitas Admin
            </h1>
            <p className="text-sm opacity-60 font-medium mt-1">Audit log semua aksi admin secara real-time</p>
          </div>
          <span className="neo-badge bg-[var(--neo-primary)] text-white font-extrabold">{logs.length} log tercatat</span>
        </div>

        {/* Filter */}
        <div className="neo-card p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="font-extrabold text-sm">Filter Aksi:</span>
          {[
            { label: "Semua", value: "" },
            { label: "User", value: "user" },
            { label: "Produk", value: "product" },
            { label: "Transaksi", value: "transaction" },
            { label: "Kategori", value: "category" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActionFilter(f.value)}
              className={`px-4 py-1.5 text-sm font-bold border-[2px] border-[var(--neo-black)] rounded-lg transition-all ${
                actionFilter === f.value
                  ? "bg-[var(--neo-primary)] text-white shadow-[2px_2px_0px_var(--neo-black)]"
                  : "bg-white hover:bg-[var(--neo-accent)]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button onClick={fetchLogs} className="ml-auto neo-btn bg-white text-sm px-3 py-1.5">🔄 Refresh</button>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="neo-card p-12 text-center animate-pulse">
            <div className="text-4xl mb-2">📋</div>
            <p className="font-bold opacity-50">Memuat log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="font-extrabold text-lg">Belum ada aktivitas tercatat</h2>
            <p className="opacity-60 text-sm mt-1">Log akan muncul setelah admin melakukan tindakan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="neo-card p-4 hover-lift cursor-pointer"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Action badge */}
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border border-black/10 whitespace-nowrap ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>

                  {/* Info */}
                  <div className="flex-grow">
                    <p className="font-bold text-sm">
                      Admin: <span className="text-[var(--neo-primary)]">{log.actorName ?? log.actorEmail ?? "—"}</span>
                    </p>
                    <p className="text-xs opacity-50 font-mono mt-0.5">
                      Target: {log.entityType}/{log.entityId.slice(0, 12)}...
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold opacity-60">{formatDate(log.createdAt)}</p>
                    {log.ipAddress && (
                      <p className="text-xs opacity-40 font-mono">{log.ipAddress}</p>
                    )}
                  </div>

                  <span className="text-xs opacity-40">{expanded === log.id ? "▲" : "▼"}</span>
                </div>

                {/* Expandable metadata */}
                {expanded === log.id && log.metadata && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-3 border-t-[2px] border-dashed border-black/10 pt-4">
                    {log.metadata.before && (
                      <div className="bg-red-50 border-[2px] border-dashed border-red-200 rounded-lg p-3">
                        <p className="text-xs font-extrabold text-red-500 mb-1">SEBELUM</p>
                        <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(log.metadata.before, null, 2)}</pre>
                      </div>
                    )}
                    {log.metadata.after && (
                      <div className="bg-green-50 border-[2px] border-dashed border-green-200 rounded-lg p-3">
                        <p className="text-xs font-extrabold text-green-600 mb-1">SESUDAH</p>
                        <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(log.metadata.after, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
