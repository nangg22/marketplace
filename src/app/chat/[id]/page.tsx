import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getMessages } from '../actions';
import ChatClient from './ChatClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Chat Room | LakuLagi' };
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/chat');
  }

  const { id } = await params;
  const { success, messages, chat, productDetails, otherUserName, error } = await getMessages(id);

  if (!success || !chat) {
    if (error === 'Unauthorized') redirect('/chat');
    notFound();
  }

  const currentUserId = (session.user as any).id;
  const isSeller = chat.sellerId === currentUserId;

  return (
    <div className="h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-3xl mx-auto w-full flex flex-col h-[calc(100vh-140px)]">
        <ChatClient 
          chatId={id} 
          initialMessages={messages} 
          productDetails={productDetails}
          otherUserName={otherUserName}
          isSeller={isSeller}
          currentUserId={currentUserId}
        />
      </main>

      <Footer />
    </div>
  );
}
