import { cn } from "@/lib/utils"

export function ThreadSeparator({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span
        className={cn(
          "rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground",
          muted && "bg-destructive/10 text-destructive"
        )}
      >
        {label}
      </span>
    </div>
  )
}
