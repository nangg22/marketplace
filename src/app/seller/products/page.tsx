import { db } from '../../../lib/db';
import { products } from '../../../lib/schema';

export default async function SellerProductsPage() {
  const data = await db.select().from(products);

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-6">Daftar Produk Saya</h1>
      <div className="grid gap-4">
        {data.map((item) => (
          <div key={item.id} className="border p-4 rounded flex justify-between">
            <div>
              <h2 className="font-bold">{item.name}</h2>
              <p>Rp{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}