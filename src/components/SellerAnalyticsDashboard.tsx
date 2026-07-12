"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  summary: { totalRevenue: number; totalOrders: number };
  topProducts: { productId: string; name: string; totalSold: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export default function SellerAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/analytics").then((r) => r.json()),
      fetch("/api/seller/low-stock").then((r) => r.json()),
    ]).then(([analyticsData, lowStockData]) => {
      setData(analyticsData);
      setLowStock(lowStockData.items ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="neo-card p-8 flex items-center justify-center gap-3 animate-pulse">
        <span className="text-2xl">📊</span>
        <p className="font-bold text-lg opacity-60">Memuat data analitik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Badge Stok Menipis */}
      {lowStock.length > 0 && (
        <div className="neo-card p-4 bg-[var(--neo-accent)] border-[3px] border-[var(--neo-black)] flex items-start gap-3 animate-slide-up">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-extrabold text-base">
              {lowStock.length} produk stoknya menipis (≤ 5)!
            </p>
            <ul className="mt-1 space-y-0.5">
              {lowStock.map((p) => (
                <li key={p.id} className="text-sm font-semibold">
                  • {p.name} — sisa <span className="font-extrabold">{p.stock}</span> pcs
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold mt-2 opacity-70">Segera tambah stok agar tidak kehabisan!</p>
          </div>
        </div>
      )}

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neo-card p-5 bg-[var(--neo-green)] hover-lift">
          <p className="text-xs font-bold opacity-80 mb-1">💰 Pendapatan (30 hari)</p>
          <p className="text-2xl font-extrabold leading-tight">
            {formatRupiah(data?.summary?.totalRevenue ?? 0)}
          </p>
        </div>
        <div className="neo-card p-5 bg-[var(--neo-green)] hover-lift">
          <p className="text-xs font-bold opacity-80 mb-1">🧾 Total Pesanan Lunas</p>
          <p className="text-2xl font-extrabold leading-tight">
            {data?.summary?.totalOrders ?? 0} pesanan
          </p>
        </div>
      </div>

      {/* Grafik Pendapatan Harian */}
      <div className="neo-card p-5 bg-[var(--neo-green)]">
        <p className="text-base font-extrabold mb-4">📈 Grafik Pendapatan Harian (30 hari terakhir)</p>
        {(data?.dailyRevenue?.length ?? 0) === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-4xl mb-2">📉</p>
            <p className="font-bold">Belum ada data pendapatan.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" fontSize={11} tick={{ fontWeight: 700 }} />
              <YAxis fontSize={11} tick={{ fontWeight: 700 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--neo-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--neo-primary)", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Produk Terlaris */}
      <div className="neo-card p-5 bg-[var(--neo-white)]">
        <p className="text-base font-extrabold mb-4">🏆 Produk Terlaris (Top 5)</p>
        {(data?.topProducts?.length ?? 0) === 0 ? (
          <div className="text-center py-6 opacity-50">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-bold">Belum ada data penjualan produk.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {data?.topProducts.map((p, i) => (
              <li
                key={p.productId}
                className="flex items-center justify-between p-3 rounded-xl border-[2px] border-[var(--neo-black)] bg-[var(--neo-gray)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-extrabold text-lg w-8 h-8 flex items-center justify-center rounded-full border-[2px] border-[var(--neo-black)] ${
                      i === 0
                        ? "bg-yellow-300"
                        : i === 1
                        ? "bg-gray-200"
                        : i === 2
                        ? "bg-orange-200"
                        : "bg-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-bold">{p.name}</span>
                </div>
                <span className="neo-badge bg-[var(--neo-primary)] text-white border-[var(--neo-black)] text-xs">
                  {p.totalSold} terjual
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
