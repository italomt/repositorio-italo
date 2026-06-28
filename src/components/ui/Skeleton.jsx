export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-fill ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-card rounded-ios-lg shadow-ios overflow-hidden ${className}`}>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6 mt-2" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonListItem({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0 ${className}`}>
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>
  )
}

export function SkeletonPill({ className = '' }) {
  return <Skeleton className={`h-8 rounded-full ${className}`} />
}
