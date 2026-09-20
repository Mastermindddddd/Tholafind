export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="animate-pulse space-y-6">
        <div className="h-3 w-24 rounded bg-paperDim" />
        <div className="h-8 w-56 rounded bg-paperDim" />
        <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-paperDim" />
          ))}
        </div>
      </div>
    </div>
  );
}