export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <div className="h-16 bg-white border-b-[4px] border-[#1A1A2E]" />
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="h-40 bg-[#FF4081]/20 rounded-2xl border-[3px] border-[#1A1A2E] animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white border-[3px] border-[#1A1A2E] rounded-xl overflow-hidden shadow-[4px_4px_0px_#1A1A2E] animate-pulse">
              <div className="aspect-square bg-[#F0F0F0]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#F0F0F0] rounded" />
                <div className="h-4 bg-[#FFD23F]/50 rounded w-3/4" />
                <div className="h-8 bg-[#F0F0F0] rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
