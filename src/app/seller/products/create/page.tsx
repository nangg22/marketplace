'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UploadButton } from '@/utils/uploadthing';
import { addProductAction } from '../actions';
import "@uploadthing/react/styles.css"; // Wajib agar tombolnya rapi

export default function CreateProductPage() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Fungsi saat form disubmit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageUrl) {
      alert("⚠️ Wajib upload gambar produk dulu ya!");
      return;
    }
    const formData = new FormData(e.currentTarget);
    await addProductAction(formData, imageUrl);
  };

  return (
    <div className="min-h-screen bg-[#FFF4E0] p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
          <h1 className="text-3xl font-black text-black tracking-tight">📦 Tambah Produk</h1>
          <Link href="/seller/products">
            <button className="bg-gray-200 text-black px-4 py-2 font-bold border-2 border-black rounded-lg hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              Batal
            </button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* AREA UPLOAD GAMBAR */}
          <div className="bg-[#E8F0FE] border-4 border-black p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px]">
            {imageUrl ? (
              <div className="relative w-full">
                <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-black mb-4" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-red-400 text-white font-bold px-3 py-1 border-2 border-black rounded">Ganti</button>
              </div>
            ) : (
              <>
                <p className="font-bold mb-4">Upload Foto Produk (Max 4MB)</p>
                <UploadButton
                  endpoint="imageUploader"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setImageUrl(res[0].url);
                    setIsUploading(false);
                    alert("✅ Gambar berhasil diupload!");
                  }}
                  onUploadError={(error: Error) => {
                    setIsUploading(false);
                    alert(`❌ ERROR: ${error.message}`);
                  }}
                />
              </>
            )}
          </div>

          <div>
            <label className="block text-black font-bold mb-2">Nama Produk</label>
            <input name="name" required placeholder="Contoh: Sepatu Sneakers" 
              className="w-full bg-[#E8F0FE] border-4 border-black p-4 rounded-xl font-bold placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400" />
          </div>
          
          <div>
            <label className="block text-black font-bold mb-2">Harga (Rp)</label>
            <input name="price" type="number" required placeholder="250000" 
              className="w-full bg-[#E8F0FE] border-4 border-black p-4 rounded-xl font-bold placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400" />
          </div>
          
          <div>
            <label className="block text-black font-bold mb-2">Deskripsi</label>
            <textarea name="description" rows={4} placeholder="Jelaskan detail produkmu..." 
              className="w-full bg-[#E8F0FE] border-4 border-black p-4 rounded-xl font-bold placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400" />
          </div>

          <button type="submit" disabled={isUploading}
            className={`w-full text-black text-xl font-black py-4 border-4 border-black rounded-xl transition-all mt-4 
              ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF90E8] hover:bg-[#FF70E0] hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}>
            SIMPAN PRODUK
          </button>
        </form>
      </div>
    </div>
  );
}