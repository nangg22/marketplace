'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
}

interface Props {
  groupId: string;
  groupName: string;
  groupColor: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
}

export default function GroupChat({ groupId, groupName, groupColor }: Props) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineCount] = useState(Math.floor(Math.random() * 40) + 10); // simulasi online
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = (session?.user as any)?.id;

  // Load pesan awal
  const loadInitial = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    if (data.messages.length > 0) {
      lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
    }
  }, [groupId]);

  // Polling — ambil pesan baru setiap 2.5 detik
  const pollMessages = useCallback(async () => {
    if (!lastTimestampRef.current) return;
    const res = await fetch(
      `/api/groups/${groupId}/messages?after=${encodeURIComponent(lastTimestampRef.current)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.messages.length > 0) {
      setMessages((prev) => [...prev, ...data.messages]);
      lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
    }
  }, [groupId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const interval = setInterval(pollMessages, 2500);
    return () => clearInterval(interval);
  }, [pollMessages]);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText('');

    const res = await fetch(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msgText }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      lastTimestampRef.current = data.message.createdAt;
    } else {
      // Kembalikan teks jika gagal
      setText(msgText);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group pesan berdasarkan tanggal
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const dateLabel = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== dateLabel) {
      groupedMessages.push({ date: dateLabel, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  return (
    <div className="neo-card overflow-hidden flex flex-col h-[520px] sm:h-[580px]">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b-[3px] border-[var(--neo-black)]"
        style={{ background: groupColor }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full border-[2px] border-white animate-pulse" />
          <span className="text-white font-extrabold text-sm">{groupName}</span>
        </div>
        <span className="text-white/80 text-xs font-bold">
          🟢 {onlineCount} online
        </span>
      </div>

      {/* Pesan */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-[var(--neo-gray)]/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-bold text-sm">Belum ada pesan. Mulai diskusi!</p>
          </div>
        )}

        {groupedMessages.map(({ date, msgs }) => (
          <div key={date}>
            {/* Tanggal divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
              <span className="text-[10px] font-extrabold opacity-50 uppercase tracking-wider">{date}</span>
              <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
            </div>

            <div className="space-y-2">
              {msgs.map((msg) => {
                const isMe = msg.userId === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {!isMe && (
                      <div
                        className="w-7 h-7 rounded-lg border-[2px] border-[var(--neo-black)] flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0"
                        style={{ background: groupColor }}
                      >
                        {msg.userName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}

                    <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Nama pengirim */}
                      {!isMe && (
                        <span className="text-[10px] font-extrabold opacity-60 px-1">
                          {msg.userName || 'Anonim'}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-3 py-2 rounded-2xl border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] text-sm font-medium leading-relaxed break-words ${
                          isMe
                            ? 'bg-[var(--neo-primary)] text-white rounded-br-sm'
                            : 'bg-white text-[var(--neo-black)] rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Waktu */}
                      <span className="text-[9px] font-bold opacity-40 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t-[3px] border-[var(--neo-black)] bg-white p-3">
        {status === 'authenticated' ? (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan... (Enter kirim, Shift+Enter baris baru)"
              rows={1}
              maxLength={500}
              className="flex-1 neo-input resize-none text-sm py-2 min-h-[40px] max-h-[120px]"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="neo-btn neo-btn-primary py-2 px-4 font-extrabold text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? '⏳' : '➤'}
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm font-bold opacity-60 mb-2">Login untuk ikut diskusi</p>
            <Link href="/login" className="neo-btn neo-btn-primary text-sm py-1.5 px-6 font-extrabold">
              ✨ Masuk
            </Link>
          </div>
        )}
        {text.length > 400 && (
          <p className="text-[10px] font-bold opacity-40 mt-1 text-right">
            {text.length}/500
          </p>
        )}
      </div>
    </div>
  );
}
