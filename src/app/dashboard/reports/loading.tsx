import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <Skeleton className="h-5 w-40" />
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex gap-2">
              {[1,2,3,4].map(j => <Skeleton key={j} className="h-12 w-16 rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
