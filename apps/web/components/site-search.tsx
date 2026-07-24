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
import type { SearchEntry, SearchKind } from "@/lib/search"

/**
 * Navbar search: a real input with results in a dropdown underneath it, not a
 * modal. cmdk drives filtering and arrow-key navigation, but `Command.Dialog`
 * is deliberately not used — the field stays on the page.
 *
 * The panel opens on focus, not on the first keystroke. Empty-state is a
 * browsable list of items with their glyphs — the delivery-app pattern, where
 * the field is also the menu — rather than a blank box that punishes you for
 * not knowing what is in here.
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

/**
 * How many rows a tab shows before you type.
 *
 * The empty state used to list all 160 items, which is a catalogue rather than
 * a search result — nobody scrolls a dropdown to find bacon, and it buried the
 * seven calculators under a hundred and sixty prices. Typing lifts the cap,
 * because at that point the list is an answer instead of an inventory.
 */
const IDLE_LIMIT = 7

const TABS: { value: "all" | SearchKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cost", label: "Costs" },
  { value: "calculator", label: "Calculators" },
]

/** "1998" anywhere in the query, as its own token. */
function yearIn(query: string) {
  const match = query.match(/\b(1[89]\d{2}|20\d{2})\b/)
  return match ? Number(match[1]) : null
}

/** The span an item covers, read off the row's own hint ("1976–2026"). */
function span(hint: string | undefined) {
  const match = hint?.match(/(\d{4})\D+(\d{4})/)
  return match ? { first: Number(match[1]), last: Number(match[2]) } : null
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
  const [tab, setTab] = React.useState<"all" | SearchKind>("all")
  const [focused, setFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  /*
   * Year results, made rather than shipped.
   *
   * Typing "eggs 1998" offers the 1998 page for every item whose name matches
   * the rest of the query and whose series actually covers 1998. The index
   * used to carry all 4,236 item-year rows to do this, in the HTML of every
   * page on the site.
   */
  const entries = React.useMemo(() => {
    const year = yearIn(query)
    if (!year) return index

    const term = query.replace(String(year), "").trim().toLowerCase()
    const years: SearchEntry[] = []
    for (const row of index) {
      if (!row.slug) continue
      const range = span(row.hint)
      if (!range || year < range.first || year > range.last) continue
      if (term && !`${row.label} ${row.keywords ?? ""}`.toLowerCase().includes(term)) continue
      years.push({
        kind: "cost",
        group: `In ${year}`,
        label: `${row.label} in ${year}`,
        href: `${row.href}/${year}`,
        keywords: `${row.keywords ?? ""} ${year}`,
        slug: row.slug,
        hint: String(year),
      })
    }
    return [...years, ...index]
  }, [index, query])

  const visible = React.useMemo(() => {
    const inTab = tab === "all" ? entries : entries.filter((e) => e.kind === tab)
    if (query.trim()) return inTab

    // Idle: a taste of each tab, not the whole catalogue. cmdk does the
    // filtering once something is typed, so the cap only applies before that.
    const perGroup = new Map<string, number>()
    return inTab.filter((entry) => {
      const seen = perGroup.get(entry.group) ?? 0
      perGroup.set(entry.group, seen + 1)
      return seen < IDLE_LIMIT
    })
  }, [entries, tab, query])

  const groups = React.useMemo(() => group(visible), [visible])
  const counts = React.useMemo(
    () => ({
      all: entries.length,
      cost: entries.filter((e) => e.kind === "cost").length,
      calculator: entries.filter((e) => e.kind === "calculator").length,
    }),
    [entries],
  )
  const open = focused

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
        className="bg-transparent p-0"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("")
            inputRef.current?.blur()
          }
        }}
      >
        <div className="bg-muted/60 focus-within:border-ring focus-within:bg-background flex h-10 items-center gap-2.5 rounded-full border border-transparent px-4 transition-colors">
          <SearchIcon className="text-muted-foreground size-4 shrink-0" />
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            onFocus={() => setFocused(true)}
            placeholder="Search eggs, gas, 1998…"
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
            "bg-popover text-popover-foreground absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border shadow-xl",
            open ? "block" : "hidden",
          )}
        >
          <div className="flex items-center gap-1 border-b p-1.5">
            {TABS.map((option) => (
              <button
                key={option.value}
                type="button"
                // `onMouseDown` + preventDefault: a plain click would blur the
                // input first, which closes the panel before the tab changes.
                onMouseDown={(event) => {
                  event.preventDefault()
                  setTab(option.value)
                }}
                aria-pressed={tab === option.value}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === option.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {option.label}
                <span className="tnum ml-1.5 font-mono opacity-60">{counts[option.value]}</span>
              </button>
            ))}
          </div>

          <CommandList className="max-h-[min(30rem,65vh)] p-1.5">
            <CommandEmpty>Nothing matches that.</CommandEmpty>
            {groups.map(([heading, rows]) => (
              <CommandGroup key={heading} heading={heading}>
                {rows.map((row) => (
                  <CommandItem
                    key={row.href}
                    value={`${row.label} ${row.keywords ?? ""}`}
                    onSelect={() => go(row.href)}
                    className="gap-3 rounded-xl py-2"
                  >
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center text-xl">
                      {row.emoji ?? (row.slug ? emojiFor(row.slug) : null)}
                    </span>
                    <span className="truncate font-medium first-letter:uppercase">{row.label}</span>
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
