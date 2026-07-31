'use server';

import { db } from '@/lib/db';
import { chats, messages, users, products } from '@/lib/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { notifyNewMessage } from '@/lib/notifications';

export async function getChats() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const userChats = await db
      .select({
        id: chats.id,
        buyerId: chats.buyerId,
        sellerId: chats.sellerId,
        productId: chats.productId,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(or(eq(chats.buyerId, userId), eq(chats.sellerId, userId)))
      .orderBy(desc(chats.updatedAt));

    const chatsWithDetails = await Promise.all(
      userChats.map(async (chat) => {
        const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
        const [otherUser] = await db
          .select({ name: users.name, avatar: users.avatarUrl, storeName: users.storeName })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        const otherUserName = (chat.buyerId === userId ? (otherUser?.storeName || otherUser?.name) : otherUser?.name) || 'User';

        let productDetails = null;
        if (chat.productId) {
           const [prod] = await db.select({ name: products.name, imageUrl: products.imageUrl, price: products.price, isNegotiable: products.isNegotiable }).from(products).where(eq(products.id, chat.productId)).limit(1);
           productDetails = prod;
        }

        const [latestMsg] = await db.select().from(messages).where(eq(messages.chatId, chat.id)).orderBy(desc(messages.createdAt)).limit(1);

        return {
          ...chat,
          otherUserName,
          otherUserAvatar: otherUser?.avatar,
          productDetails,
          latestMessage: latestMsg || null,
        };
      })
    );

    return { success: true, chats: chatsWithDetails };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOrCreateChat(sellerId: string, productId?: string) {
  const session = await getServerSession(authOptions);
  const buyerId = (session?.user as any)?.id;
  if (!buyerId) return { success: false, error: 'Unauthorized' };
  
  if (buyerId === sellerId) {
    return { success: false, error: 'Cannot chat with yourself' };
  }

  try {
    let condition = and(eq(chats.buyerId, buyerId), eq(chats.sellerId, sellerId));
    if (productId) {
      condition = and(condition, eq(chats.productId, productId));
    }

    const existingChats = await db.select().from(chats).where(condition).orderBy(desc(chats.updatedAt)).limit(1);
    
    if (existingChats.length > 0) {
      return { success: true, chatId: existingChats[0].id };
    }

    const [newChat] = await db.insert(chats).values({
      buyerId,
      sellerId,
      productId: productId || null,
    }).returning({ id: chats.id });

    return { success: true, chatId: newChat.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMessages(chatId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (!chat) return { success: false, error: 'Chat not found' };
    if (chat.buyerId !== userId && chat.sellerId !== userId) return { success: false, error: 'Unauthorized' };

    const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
    
    let productDetails = null;
    if (chat.productId) {
        const [prod] = await db.select().from(products).where(eq(products.id, chat.productId)).limit(1);
        productDetails = prod;
    }

    const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
    const [otherUser] = await db.select({ name: users.name, storeName: users.storeName }).from(users).where(eq(users.id, otherUserId)).limit(1);
    const otherUserName = chat.buyerId === userId ? (otherUser?.storeName || otherUser?.name) : otherUser?.name;

    return { success: true, messages: chatMessages, chat, productDetails, otherUserName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendMessage(chatId: string, text: string, isOffer: boolean = false, offerPrice?: number) {
  const session = await getServerSession(authOptions);
  const senderId = (session?.user as any)?.id;
  if (!senderId) return { success: false, error: 'Unauthorized' };

  try {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (!chat) return { success: false, error: 'Chat not found' };
    if (chat.buyerId !== senderId && chat.sellerId !== senderId) return { success: false, error: 'Unauthorized' };

    await db.insert(messages).values({
      chatId,
      senderId,
      text,
      isOffer,
      offerPrice: offerPrice || null,
      offerStatus: isOffer ? 'pending' : null,
    });

    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

    // Kirim notifikasi ke penerima pesan
    try {
      const recipientId = chat.buyerId === senderId ? chat.sellerId : chat.buyerId;
      const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, senderId)).limit(1);
      let productName: string | undefined;
      if (chat.productId) {
        const [prod] = await db.select({ name: products.name }).from(products).where(eq(products.id, chat.productId)).limit(1);
        productName = prod?.name;
      }
      await notifyNewMessage(recipientId, sender?.name || 'Seseorang', chatId, productName);
    } catch (_) {
      // Jangan gagalkan pengiriman pesan jika notifikasi error
    }

    revalidatePath(`/chat/${chatId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOfferStatus(messageId: string, status: 'accepted' | 'rejected') {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!msg || !msg.isOffer) return { success: false, error: 'Offer not found' };

    const [chat] = await db.select().from(chats).where(eq(chats.id, msg.chatId)).limit(1);
    if (!chat) return { success: false, error: 'Chat not found' };

    if (chat.sellerId !== userId) return { success: false, error: 'Only seller can update offer' };

    await db.update(messages).set({ offerStatus: status }).where(eq(messages.id, messageId));
    
    const statusText = status === 'accepted' ? 'menyetujui' : 'menolak';
    await db.insert(messages).values({
      chatId: chat.id,
      senderId: userId,
      text: `Penjual ${statusText} tawaran harga Rp${msg.offerPrice?.toLocaleString('id-ID')}`,
    });

    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chat.id));

    revalidatePath(`/chat/${chat.id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
