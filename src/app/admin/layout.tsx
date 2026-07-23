import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if ((session.user as any).role !== 'admin') {
    redirect('/');
  }

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
