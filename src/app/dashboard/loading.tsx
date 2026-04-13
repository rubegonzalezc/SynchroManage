import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-5 w-full pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Cards row */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
