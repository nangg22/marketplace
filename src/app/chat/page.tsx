import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getChats } from './actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChatInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/chat');
  }

  const { success, chats, error } = await getChats();

  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-2">
          <span className="text-4xl">💬</span> Pesan Saya
        </h1>

        {!success ? (
          <div className="neo-card p-6 border-red-500 bg-red-50 text-red-700">
            Error: {error}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="neo-card p-12 text-center flex flex-col items-center justify-center">
            <div className="text-6xl mb-4 animate-float opacity-80">📭</div>
            <h2 className="text-xl font-extrabold mb-2">Belum ada pesan</h2>
            <p className="opacity-70 font-medium max-w-sm mb-6">
              Mulai berbelanja dan hubungi penjual untuk bertanya seputar produk preloved incaranmu.
            </p>
            <Link href="/" className="neo-btn neo-btn-primary px-6 py-2">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="neo-card divide-y-[3px] divide-[var(--neo-black)] overflow-hidden">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-4 p-4 md:p-6 hover:bg-[var(--neo-accent)] transition-colors group block"
              >
                {/* Avatar */}
                <div className="w-12 h-12 flex-shrink-0 rounded-xl border-[3px] border-[var(--neo-black)] bg-[var(--neo-primary)] text-white flex items-center justify-center font-extrabold text-lg overflow-hidden shadow-[2px_2px_0px_var(--neo-black)] group-hover:-translate-y-1 transition-transform">
                  {chat.otherUserAvatar ? (
                    <img src={chat.otherUserAvatar} alt={chat.otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    chat.otherUserName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-extrabold truncate text-base md:text-lg text-[var(--neo-black)]">
                      {chat.otherUserName}
                    </h3>
                    <span className="text-xs font-bold opacity-50 flex-shrink-0 ml-2">
                      {new Date(chat.updatedAt).toLocaleDateString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  {chat.productDetails && (
                    <div className="text-xs font-semibold px-2 py-0.5 bg-[var(--neo-secondary)] text-white border-[2px] border-[var(--neo-black)] rounded-md inline-block mb-1 truncate max-w-full">
                      🛍️ {chat.productDetails.name}
                    </div>
                  )}

                  <p className="text-sm font-medium opacity-70 truncate">
                    {chat.latestMessage ? (
                      chat.latestMessage.isOffer ? (
                        <span className="text-[var(--neo-primary)] font-bold">Ajuan Nego: Rp{chat.latestMessage.offerPrice?.toLocaleString('id-ID')}</span>
                      ) : (
                        chat.latestMessage.text
                      )
                    ) : (
                      <i className="opacity-50">Belum ada pesan...</i>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
