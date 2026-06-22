import { create } from 'zustand';

// Mendefinisikan tipe data item di keranjang
export interface CartItem {
  id: string;
  name: string;
  price: number;
  storeName: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  
  // Fungsi untuk menambah barang
  addToCart: (item) => set((state) => {
    const existingItem = state.items.find((i) => i.id === item.id);
    if (existingItem) {
      // Jika barang sudah ada, tambah jumlahnya (quantity)
      return {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    // Jika barang baru, masukkan ke array dengan quantity 1
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),

  // Fungsi untuk menghapus barang
  removeFromCart: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id),
  })),

  // Fungsi untuk mengosongkan keranjang (dipakai setelah bayar)
  clearCart: () => set({ items: [] }),
}));