export default function ApiKeysLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-800 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-800/50 rounded w-56" />
        </div>
        <div className="h-10 w-36 bg-gray-800 rounded" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <div className="h-5 bg-gray-800 rounded w-24" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded w-32" />
                <div className="h-3 bg-gray-800/50 rounded w-48" />
              </div>
              <div className="h-8 w-20 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
