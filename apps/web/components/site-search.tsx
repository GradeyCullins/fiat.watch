"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { cn } from "@workspace/ui/lib/utils"

import { ItemArt, hasArt } from "@/components/item-art"
import { colorFor } from "@/lib/series"
import type { SearchEntry } from "@/lib/search"

/** Rows are grouped in index order so the palette's sections stay stable. */
function group(entries: SearchEntry[]) {
  const out = new Map<string, SearchEntry[]>()
  for (const e of entries) {
    const bucket = out.get(e.group)
    if (bucket) bucket.push(e)
    else out.set(e.group, [e])
  }
  return [...out]
}

export function SiteSearch({
  index,
  className,
}: {
  index: SearchEntry[]
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const groups = React.useMemo(() => group(index), [index])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
        return
      }
      // A bare "/" is the other conventional opener, but it has to yield to
      // anyone typing a fraction into the amount field.
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Base UI's dialog moves focus to the first focusable node in the popup,
  // which is the list, not the input — so the palette opens unable to accept
  // typing. Claim it back once the popup has settled.
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  const go = React.useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group text-muted-foreground hover:bg-accent hover:text-foreground ruled flex h-10 w-full items-center gap-2.5 border-2 px-3 text-left text-sm transition-colors",
          className,
        )}
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="truncate">Search prices, years, calculators…</span>
        <KbdGroup className="ml-auto hidden sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Fiat Watch"
        description="Jump to a price series, a year, or a calculator."
        className="rounded-none! ruled border-2"
      >
        <Command className="rounded-none!" loop>
          <CommandInput ref={inputRef} placeholder="Try “eggs 1998”, “gas”, or “salary”…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Nothing matches that.</CommandEmpty>
            {groups.map(([heading, rows]) => (
              <CommandGroup key={heading} heading={heading}>
                {rows.map((row) => (
                  <CommandItem
                    key={row.href}
                    value={`${row.label} ${row.keywords ?? ""}`}
                    onSelect={() => go(row.href)}
                  >
                    {row.slug && hasArt(row.slug) ? (
                      <ItemArt
                        slug={row.slug}
                        className="size-4"
                        style={{ color: colorFor(row.slug) }}
                      />
                    ) : null}
                    <span className="truncate">{row.label}</span>
                    {row.hint ? (
                      <CommandShortcut className="tnum">{row.hint}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
