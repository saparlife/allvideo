export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-[#030306] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-pulse">
          <div className="h-12 bg-gray-800 rounded w-64 mx-auto mb-4" />
          <div className="h-6 bg-gray-800/50 rounded w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 bg-gray-800/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
