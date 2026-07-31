'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, updateOfferStatus } from '../actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChatClient({
  chatId,
  initialMessages,
  productDetails,
  otherUserName,
  isSeller,
  currentUserId,
}: {
  chatId: string;
  initialMessages: any[];
  productDetails: any;
  otherUserName: string;
  isSeller: boolean;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNegoMode, setIsNegoMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await getMessages(chatId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !isNegoMode) return;
    if (isNegoMode && (!offerPrice || isNaN(Number(offerPrice)))) return;

    setIsSending(true);
    const finalPrice = isNegoMode ? Number(offerPrice) : undefined;
    const finalText = isNegoMode ? `Mengajukan penawaran harga: Rp${finalPrice?.toLocaleString('id-ID')}` : inputText;

    const res = await sendMessage(chatId, finalText, isNegoMode, finalPrice);
    if (res.success) {
      setInputText('');
      setOfferPrice('');
      setIsNegoMode(false);
      // Optimistic or immediate refetch
      const refresh = await getMessages(chatId);
      if (refresh.success && refresh.messages) {
        setMessages(refresh.messages);
      }
    }
    setIsSending(false);
  };

  const handleUpdateOffer = async (msgId: string, status: 'accepted' | 'rejected') => {
    await updateOfferStatus(msgId, status);
    const refresh = await getMessages(chatId);
    if (refresh.success && refresh.messages) {
      setMessages(refresh.messages);
    }
  };

  return (
    <div className="flex flex-col h-full neo-card overflow-hidden mt-4">
      {/* Chat Header */}
      <div className="bg-[var(--neo-primary)] text-white p-4 border-b-[3px] border-[var(--neo-black)] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            ⬅️
          </Link>
          <div>
            <h2 className="font-extrabold text-lg leading-tight">{otherUserName}</h2>
            {isSeller ? (
              <span className="text-xs bg-[var(--neo-accent)] text-[var(--neo-black)] px-2 py-0.5 rounded-full font-bold shadow-[1px_1px_0px_var(--neo-black)] border-[1px] border-[var(--neo-black)]">Pembeli</span>
            ) : (
              <span className="text-xs bg-[var(--neo-secondary)] text-white px-2 py-0.5 rounded-full font-bold shadow-[1px_1px_0px_var(--neo-black)] border-[1px] border-[var(--neo-black)]">Penjual</span>
            )}
          </div>
        </div>
      </div>

      {/* Product Context */}
      {productDetails && (
        <div className="bg-[var(--neo-bg)] p-3 border-b-[2px] border-dashed border-[var(--neo-black)] flex items-center gap-3">
          {productDetails.imageUrl ? (
            <img src={productDetails.imageUrl} alt="Product" className="w-12 h-12 rounded-lg border-[2px] border-[var(--neo-black)] object-cover" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg border-[2px] border-[var(--neo-black)] flex items-center justify-center">🛍️</div>
          )}
          <div>
            <div className="font-bold text-sm truncate">{productDetails.name}</div>
            <div className="text-[var(--neo-primary)] font-extrabold text-sm">Rp{productDetails.price.toLocaleString('id-ID')}</div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white/50">
        {messages.length === 0 ? (
          <div className="text-center text-sm font-bold opacity-50 mt-10">Belum ada pesan. Mulai percakapan sekarang!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {msg.isOffer ? (
                  <div className={`max-w-[80%] border-[3px] border-[var(--neo-black)] rounded-xl p-3 ${isMe ? 'bg-[var(--neo-accent)] rounded-tr-none' : 'bg-white rounded-tl-none'} shadow-[3px_3px_0px_var(--neo-black)]`}>
                    <div className="text-xs font-bold opacity-60 mb-1">PENAWARAN HARGA</div>
                    <div className="font-extrabold text-xl mb-2">Rp{msg.offerPrice?.toLocaleString('id-ID')}</div>
                    
                    {msg.offerStatus === 'pending' ? (
                      isSeller ? (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdateOffer(msg.id, 'accepted')} className="neo-btn bg-[var(--neo-primary)] text-white text-xs py-1 px-3">Terima</button>
                          <button onClick={() => handleUpdateOffer(msg.id, 'rejected')} className="neo-btn bg-[var(--neo-secondary)] text-white text-xs py-1 px-3">Tolak</button>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-[var(--neo-secondary)] bg-white/50 px-2 py-1 rounded-md border-[1px] border-[var(--neo-black)] inline-block">Menunggu Respon...</div>
                      )
                    ) : (
                      <div className={`text-xs font-bold px-2 py-1 rounded-md border-[1px] border-[var(--neo-black)] inline-block ${msg.offerStatus === 'accepted' ? 'bg-green-300 text-green-900' : 'bg-red-300 text-red-900'}`}>
                        {msg.offerStatus === 'accepted' ? '✅ Disetujui' : '❌ Ditolak'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`max-w-[80%] border-[3px] border-[var(--neo-black)] rounded-xl p-3 font-medium text-sm ${isMe ? 'bg-[var(--neo-primary)] text-white rounded-tr-none' : 'bg-white rounded-tl-none'} shadow-[3px_3px_0px_var(--neo-black)]`}>
                    {msg.text}
                  </div>
                )}
                <div className="text-[10px] font-bold opacity-40 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 md:p-4 border-t-[3px] border-[var(--neo-black)]">
        {isNegoMode ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <button type="button" onClick={() => setIsNegoMode(false)} className="neo-btn neo-btn-outline px-3" title="Batal Nego">❌</button>
            <div className="relative flex-grow flex items-center">
              <span className="absolute left-3 font-extrabold opacity-60">Rp</span>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Masukkan harga penawaran..."
                className="w-full h-full neo-input pl-10"
                autoFocus
                required
              />
            </div>
            <button type="submit" disabled={isSending} className="neo-btn bg-[var(--neo-primary)] text-white">Nego</button>
          </form>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            {!isSeller && productDetails?.isNegotiable && (
              <button
                type="button"
                onClick={() => setIsNegoMode(true)}
                className="neo-btn bg-[var(--neo-accent)] text-[var(--neo-black)] text-sm px-3 flex-shrink-0"
                title="Ajukan Penawaran"
              >
                🤝 Nego
              </button>
            )}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-grow neo-input"
            />
            <button type="submit" disabled={isSending || !inputText.trim()} className="neo-btn neo-btn-primary flex-shrink-0 px-4">
              Kirim
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
