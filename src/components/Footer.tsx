export default function Footer() {
  return (
    <footer className="bg-[var(--neo-black)] text-white border-t-[4px] border-[var(--neo-accent)] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="mb-4">
          <span className="text-2xl font-extrabold">
            <span className="inline-block bg-[var(--neo-primary)] px-2 py-0.5 border-[2px] border-white rounded-lg mr-1">
              Mall
            </span>
            Pedia
          </span>
        </div>
        <p className="text-sm opacity-70 font-medium mb-4">
          Marketplace  — Tugas Akhir © 2026
        </p>
        <div className="flex justify-center gap-3">
          <span className="neo-badge bg-[var(--neo-secondary)] text-white border-white/30 hover-wiggle cursor-default">
            Next.js
          </span>
          <span className="neo-badge bg-[var(--neo-green)] text-[var(--neo-black)] border-white/30 hover-wiggle cursor-default">
            Neon DB
          </span>
          <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-black)] border-white/30 hover-wiggle cursor-default">
            Drizzle ORM
          </span>
        </div>
      </div>
    </footer>
  );
}
