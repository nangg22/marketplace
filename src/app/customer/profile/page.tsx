import { redirect } from 'next/navigation';

/**
 * /customer/profile dialihkan ke /profile agar semua role
 * bisa mengedit profil sendiri tanpa melalui admin.
 */
export default function CustomerProfilePage() {
  redirect('/profile');
}
