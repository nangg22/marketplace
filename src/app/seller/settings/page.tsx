import { redirect } from 'next/navigation';

/**
 * /seller/settings dialihkan ke /profile karena pengaturan profil toko
 * (nama toko, deskripsi toko) sudah terintegrasi di tab "Info Toko" pada halaman profil.
 * Ini juga memicu update hasStoreProfile pada onboarding saat seller menyimpan nama toko.
 */
export default function SellerSettingsPage() {
  redirect('/profile');
}
