import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AvatarStackProps {
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  maxVisible?: number // default: 3
}

/**
 * Returns the assignees that should be visible (up to maxVisible).
 */
export function getVisibleAssignees<
  T extends { id: string; full_name: string; avatar_url: string | null },
>(assignees: T[], maxVisible: number = 3): T[] {
  return assignees.slice(0, maxVisible)
}

/**
 * Returns the overflow count (how many assignees are hidden).
 * Returns 0 if total <= maxVisible.
 */
export function getOverflowCount(total: number, maxVisible: number = 3): number {
  return total > maxVisible ? total - maxVisible : 0
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AvatarStack({ assignees, maxVisible = 3 }: AvatarStackProps) {
  const visible = getVisibleAssignees(assignees, maxVisible)
  const overflow = getOverflowCount(assignees.length, maxVisible)

  if (assignees.length === 0) return null

  return (
    <AvatarGroup>
      {visible.map((assignee) => (
        <Tooltip key={assignee.id}>
          <TooltipTrigger asChild>
            <Avatar size="sm">
              {assignee.avatar_url && (
                <AvatarImage
                  src={assignee.avatar_url}
                  alt={assignee.full_name}
                />
              )}
              <AvatarFallback>{getInitials(assignee.full_name)}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{assignee.full_name}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AvatarGroupCount>+{overflow}</AvatarGroupCount>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {assignees
                .slice(maxVisible)
                .map((a) => a.full_name)
                .join(", ")}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </AvatarGroup>
  )
}
