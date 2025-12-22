export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-800/50 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-800/50 rounded-xl" />
    </div>
  );
}
