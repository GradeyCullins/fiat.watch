"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { cn } from "@workspace/ui/lib/utils"

import { emojiFor } from "@/lib/emoji"
import type { SearchEntry } from "@/lib/search"

/**
 * Navbar search: a real input with results in a dropdown underneath it, not a
 * modal. cmdk drives filtering and arrow-key navigation, but `Command.Dialog`
 * is deliberately not used — the field stays on the page.
 *
 * The panel only opens once something is typed. An empty dropdown listing all
 * 240 rows on focus is a menu, not a search.
 */
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
  const [query, setQuery] = React.useState("")
  const [focused, setFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const groups = React.useMemo(() => group(index), [index])
  const open = focused && query.trim().length > 0

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Close on any click outside the field or its panel. `pointerdown` rather
  // than `blur` so clicking a result still lands on the result.
  React.useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const go = React.useCallback(
    (href: string) => {
      setQuery("")
      setFocused(false)
      inputRef.current?.blur()
      router.push(href)
    },
    [router],
  )

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Command
        loop
        className="rounded-none! bg-transparent p-0"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("")
            inputRef.current?.blur()
          }
        }}
      >
        <div className="ruled bg-card focus-within:border-ring flex h-10 items-center gap-2.5 border px-3 transition-colors">
          <SearchIcon className="text-muted-foreground size-4 shrink-0" />
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            onFocus={() => setFocused(true)}
            placeholder="Search prices, years, calculators…"
            className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-sm outline-hidden"
          />
          {query ? null : (
            <KbdGroup className="hidden shrink-0 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          )}
        </div>

        <div
          className={cn(
            "ruled bg-popover text-popover-foreground absolute inset-x-0 top-[calc(100%+2px)] z-50 border shadow-lg",
            open ? "block" : "hidden",
          )}
        >
          <CommandList className="max-h-[min(28rem,60vh)]">
            <CommandEmpty>Nothing matches that.</CommandEmpty>
            {groups.map(([heading, rows]) => (
              <CommandGroup key={heading} heading={heading}>
                {rows.map((row) => (
                  <CommandItem
                    key={row.href}
                    value={`${row.label} ${row.keywords ?? ""}`}
                    onSelect={() => go(row.href)}
                  >
                    {row.slug ? (
                      <span aria-hidden className="grid size-4 place-items-center">
                        {emojiFor(row.slug)}
                      </span>
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
        </div>
      </Command>
    </div>
  )
}
