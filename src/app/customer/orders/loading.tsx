export default function Loading() {
  return (
    <div className="bg-[#F5E6D3] min-h-screen">
      <div className="h-16 bg-white border-b-[4px] border-[#1A1A2E]" />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-10 w-48 bg-white border-[3px] border-[#1A1A2E] rounded-xl animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border-[3px] border-[#1A1A2E] rounded-xl p-6 shadow-[4px_4px_0px_#1A1A2E] animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-[#F0F0F0] rounded w-1/3" />
                <div className="h-5 bg-[#F0F0F0] rounded w-1/2" />
              </div>
              <div className="h-10 w-28 bg-[#FFD23F]/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
