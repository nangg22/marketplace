import { db } from '../../../../lib/db';
import { products } from '../../../../lib/schema';
import { redirect } from 'next/navigation';

export default function CreateProductPage() {
  // Fungsi Server Action untuk menyimpan data
  async function addProduct(formData: FormData) {
    'use server'; // Ini yang membuat fungsi ini berjalan di server
    
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const description = formData.get('description') as string;

    await db.insert(products).values({ name, price, description });
    
    // Setelah sukses, lempar balik ke daftar produk
    redirect('/seller/products');
  }

  return (
    <div className="max-w-xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk Baru</h1>
      <form action={addProduct} className="flex flex-col gap-4">
        <input name="name" placeholder="Nama Produk" className="border p-2 rounded" required />
        <input name="price" type="number" placeholder="Harga" className="border p-2 rounded" required />
        <textarea name="description" placeholder="Deskripsi" className="border p-2 rounded" />
        <button type="submit" className="bg-emerald-600 text-white p-2 rounded">
          Simpan Produk
        </button>
      </form>
    </div>
  );
}