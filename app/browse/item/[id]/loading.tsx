export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-16 sm:px-8">
      <div className="animate-pulse grid gap-8 sm:grid-cols-[1fr_1.1fr]">
        <div className="aspect-square rounded-md bg-paperDim" />
        <div className="space-y-4">
          <div className="h-5 w-20 rounded-full bg-paperDim" />
          <div className="h-8 w-full rounded bg-paperDim" />
          <div className="h-6 w-32 rounded bg-paperDim" />
        </div>
      </div>
    </div>
  );
}