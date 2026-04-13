import { Skeleton } from '@/components/ui/skeleton'

export default function MyTasksLoading() {
  return (
    <div className="h-full flex flex-col gap-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* Project selector */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* Content split */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Task list */}
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="hidden md:block w-[380px] flex-shrink-0">
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
