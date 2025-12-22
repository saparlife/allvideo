export default function DashboardPageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <div className="h-8 bg-gray-800 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-800/50 rounded w-56" />
        </div>
        <div className="h-10 w-36 bg-gray-800 rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-800 rounded w-24" />
              <div className="h-4 w-4 bg-gray-800 rounded" />
            </div>
            <div className="h-8 bg-gray-800 rounded w-20 mb-2" />
            <div className="h-3 bg-gray-800/50 rounded w-32 mb-3" />
            <div className="h-2 bg-gray-800 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
        <div className="p-6 border-b border-gray-800">
          <div className="h-6 bg-gray-800 rounded w-36" />
        </div>
        <div className="p-6">
          <div className="h-48 bg-gray-800/30 rounded" />
        </div>
      </div>
    </div>
  );
}
