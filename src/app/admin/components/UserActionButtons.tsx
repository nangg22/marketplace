'use client';

import { useEffect, useState, useTransition } from 'react';
import { banUser, unbanUser, changeUserRole, deleteUser } from '@/app/admin/actions';
import { createPortal } from 'react-dom';

type Role = 'customer' | 'seller' | 'admin';

interface Props {
  userId: string;
  userName: string;
  currentRole: Role;
  isBanned: boolean;
}

export default function UserActionButtons({ userId, userName, currentRole, isBanned }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isPending, startTransition] = useTransition();
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);

  const handleBan = () => {
    if (!banReason.trim()) return alert('Tulis alasan ban terlebih dahulu!');
    startTransition(async () => {
      await banUser(userId, banReason);
      setShowBanModal(false);
      setBanReason('');
    });
  };

  const handleUnban = () => {
    if (!confirm(`Cabut ban untuk ${userName}?`)) return;
    startTransition(async () => { await unbanUser(userId); });
  };

  const handleRoleChange = () => {
    if (selectedRole === currentRole) return setShowRoleModal(false);
    if (!confirm(`Ubah role ${userName} menjadi "${selectedRole}"?`)) return;
    startTransition(async () => {
      await changeUserRole(userId, selectedRole);
      setShowRoleModal(false);
    });
  };

  const handleDelete = () => {
    if (!confirm(`⚠️ HAPUS PERMANEN akun "${userName}"? Semua produk miliknya juga akan terhapus. Tindakan ini tidak bisa dibatalkan!`)) return;
    startTransition(async () => { await deleteUser(userId); });
  };

  return (
    <>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {/* Role */}
        <button
          onClick={() => setShowRoleModal(true)}
          disabled={isPending}
          className="neo-btn bg-[var(--neo-secondary)] text-white border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
        >
          🎭 Role
        </button>

        {/* Ban / Unban */}
        {isBanned ? (
          <button
            onClick={handleUnban}
            disabled={isPending}
            className="neo-btn bg-[var(--neo-green)] text-[var(--neo-black)] border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
          >
            ✅ Unban
          </button>
        ) : (
          <button
            onClick={() => setShowBanModal(true)}
            disabled={isPending || currentRole === 'admin'}
            className="neo-btn bg-[var(--neo-accent)] text-[var(--neo-black)] border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-40"
          >
            🚫 Ban
          </button>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isPending || currentRole === 'admin'}
          className="neo-btn bg-[var(--neo-pink)] text-white border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-40"
        >
          🗑️
        </button>
      </div>

      {/* Modal Ban */}
      {mounted && showBanModal && createPortal(
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="neo-card max-w-sm w-full p-6 animate-bounce-in">
            <h3 className="font-extrabold text-lg mb-1">🚫 Ban Pengguna</h3>
            <p className="text-sm opacity-70 mb-4">Akun <strong>{userName}</strong> tidak bisa login setelah di-ban.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Alasan ban (wajib diisi)..."
              className="neo-input resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowBanModal(false)} className="neo-btn neo-btn-outline flex-1 py-2">Batal</button>
              <button onClick={handleBan} disabled={isPending} className="neo-btn bg-[var(--neo-pink)] text-white border-[var(--neo-black)] flex-1 py-2 font-extrabold disabled:opacity-50">
                {isPending ? '⏳...' : '🚫 Ban Sekarang'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Role */}
      {mounted && showRoleModal && createPortal(
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="neo-card max-w-sm w-full p-6 animate-bounce-in">
            <h3 className="font-extrabold text-lg mb-1">🎭 Ubah Role</h3>
            <p className="text-sm opacity-70 mb-4">Pengguna: <strong>{userName}</strong></p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['customer', 'seller', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`neo-btn py-2 text-xs font-extrabold ${
                    selectedRole === r
                      ? 'bg-[var(--neo-primary)] text-white'
                      : 'neo-btn-outline'
                  }`}
                >
                  {r === 'customer' ? '🛒' : r === 'seller' ? '🏪' : '⚙️'} {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRoleModal(false)} className="neo-btn neo-btn-outline flex-1 py-2">Batal</button>
              <button onClick={handleRoleChange} disabled={isPending} className="neo-btn neo-btn-primary flex-1 py-2 font-extrabold disabled:opacity-50">
                {isPending ? '⏳...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
