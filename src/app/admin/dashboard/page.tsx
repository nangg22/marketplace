import { db } from '@/lib/db';
import { products, users, orders } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const [allProducts, allUsers, allOrders] = await Promise.all([
    db.select().from(products),
    db.select().from(users),
    db.select().from(orders),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const sellers = allUsers.filter(u => u.role === 'seller');
  const customers = allUsers.filter(u => u.role === 'customer');

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const stats = [
    { label: 'Total User', value: allUsers.length, icon: '👥', color: 'bg-[var(--neo-secondary)]', textColor: 'text-white', href: '/admin/users' },
    { label: 'Total Produk', value: allProducts.length, icon: '📦', color: 'bg-[var(--neo-primary)]', textColor: 'text-white', href: '/admin/products' },
    { label: 'Total Transaksi', value: allOrders.length, icon: '🧾', color: 'bg-[var(--neo-pink)]', textColor: 'text-white', href: '/admin/transactions' },
    { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: '💰', color: 'bg-[var(--neo-accent)]', textColor: 'text-[var(--neo-black)]', href: '/admin/transactions' },
  ];

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="absolute top-6 right-10 text-5xl animate-float opacity-20 hidden lg:block">⚙️</div>

        {/* Header */}
        <div className="mb-10 animate-slide-up">
          <h1 className="text-4xl font-extrabold flex items-center gap-3 mb-2">
            <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-3 py-1 border-[3px] border-[var(--neo-accent)] rounded-xl shadow-[4px_4px_0px_var(--neo-accent)] rotate-[-1deg]">
              ⚙️
            </span>
            Admin Dashboard
          </h1>
          <p className="font-semibold opacity-60 text-lg">Monitor & kontrol seluruh ekosistem MallPedia.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12 animate-slide-up stagger-1">
          {stats.map((stat, i) => (
            <Link href={stat.href} key={i}>
              <div className={`neo-card p-6 ${stat.color} ${stat.textColor} hover-lift cursor-pointer stagger-${i + 1}`}>
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-2xl font-extrabold mb-1 leading-tight">{stat.value}</div>
                <div className="text-sm font-bold opacity-80">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="neo-zigzag opacity-20 mb-10" />

        {/* Menu Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
          {[
            { title: 'Kelola User', desc: `${sellers.length} penjual · ${customers.length} pembeli`, icon: '👥', href: '/admin/users', color: 'bg-[var(--neo-secondary)] text-white' },
            { title: 'Kelola Produk', desc: `${allProducts.length} produk terdaftar`, icon: '📦', href: '/admin/products', color: 'bg-[var(--neo-primary)] text-white' },
            { title: 'Semua Transaksi', desc: `${allOrders.length} transaksi · ${formatRupiah(totalRevenue)}`, icon: '🧾', href: '/admin/transactions', color: 'bg-[var(--neo-pink)] text-white' },
          ].map((item, i) => (
            <Link href={item.href} key={i}>
              <div className={`neo-card p-6 ${item.color} hover-lift cursor-pointer stagger-${i + 1} flex items-start gap-4`}>
                <span className="text-5xl">{item.icon}</span>
                <div>
                  <h3 className="font-extrabold text-xl mb-1">{item.title}</h3>
                  <p className="text-sm font-semibold opacity-80">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
