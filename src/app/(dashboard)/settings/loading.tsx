export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-800 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-800/50 rounded w-48" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="h-6 bg-gray-800 rounded w-24" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-800/50 rounded" />
          <div className="h-10 bg-gray-800/50 rounded" />
        </div>
        <div className="h-10 w-24 bg-gray-800 rounded" />
      </div>
    </div>
  );
}
