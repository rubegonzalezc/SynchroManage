import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="rounded-lg border bg-card">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
