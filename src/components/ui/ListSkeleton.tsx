interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

/** Shimmering placeholder rows matching the app's list layout. */
export const ListSkeleton = ({ rows = 5, className = "" }: ListSkeletonProps) => (
  <div className={`space-y-2 p-4 ${className}`} aria-hidden>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded-full animate-shimmer" />
          <div className="h-2.5 w-1/3 rounded-full animate-shimmer" />
        </div>
        <div className="h-3 w-14 rounded-full animate-shimmer" />
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`h-24 w-full rounded-2xl animate-shimmer ${className}`} aria-hidden />
);

export default ListSkeleton;