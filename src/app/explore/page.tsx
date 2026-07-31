import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { getExploreFeed } from "./actions";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Explore Komunitas | LakuLagi",
};

export default async function ExplorePage() {
  const posts = await getExploreFeed();
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b-[4px] border-[var(--neo-black)] animate-slide-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
              <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-2xl rotate-[-3deg]">🌍</span>
              Explore
            </h1>
            <p className="mt-2 text-sm font-bold opacity-70">
              Temukan inspirasi OOTD, ulasan barang bekas, dan temui komunitas LakuLagi.
            </p>
          </div>
          {session ? (
            <Link href="/explore/create" className="neo-btn neo-btn-primary font-extrabold whitespace-nowrap">
              ✍️ Buat Postingan
            </Link>
          ) : (
            <Link href="/login" className="neo-btn neo-btn-accent font-extrabold whitespace-nowrap">
              ✨ Login untuk Posting
            </Link>
          )}
        </div>

        {/* Feed - Masonry Layout via CSS columns */}
        {posts.length === 0 ? (
          <div className="neo-card text-center py-20 animate-slide-up">
            <span className="text-6xl mb-4 block animate-bounce-in">🍃</span>
            <h2 className="text-2xl font-extrabold mb-2">Belum ada postingan</h2>
            <p className="font-bold opacity-60 mb-6">Jadilah yang pertama membagikan inspirasimu di komunitas LakuLagi!</p>
            {session && (
              <Link href="/explore/create" className="neo-btn neo-btn-primary inline-block">
                Mulai Memposting
              </Link>
            )}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 animate-slide-up">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
