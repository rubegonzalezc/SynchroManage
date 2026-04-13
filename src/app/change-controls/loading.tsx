import { Skeleton } from '@/components/ui/skeleton'

export default function ChangeControlsLoading() {
  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
      <div className="rounded-lg border bg-card">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
