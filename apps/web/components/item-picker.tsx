"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { emojiFor } from "@/lib/emoji"

export interface PickerItem {
  slug: string
  label: string
  labelAttributive: string
  /** Shown on the right of the row — how many places have it. */
  hint?: string
}

/**
 * One control instead of eighty-three.
 *
 * The map used to open on every mappable item as a chip, which is six rows of
 * pills before you reach the map and no faster to use than reading a list —
 * "find bacon" means scanning eighty-three labels. A picker you can type into
 * is the same interaction as the site's own search, and it collapses to a
 * single button showing what is currently selected.
 */
export function ItemPicker({
  items,
  value,
  onChange,
  quick,
}: {
  items: PickerItem[]
  value: string
  onChange: (slug: string) => void
  /** A few slugs worth one tap, shown beside the picker. */
  quick?: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const selected = items.find((i) => i.slug === value)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full pr-3 pl-3.5 font-medium"
              aria-label="Choose an item"
            />
          }
        >
          <span aria-hidden className="text-xl leading-none">
            {selected ? emojiFor(selected.slug) : "🔎"}
          </span>
          <span className="first-letter:uppercase">
            {selected?.labelAttributive ?? "Choose an item"}
          </span>
          <ChevronDownIcon className="size-4 opacity-60" />
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[min(22rem,90vw)] p-0">
          <Command loop>
            <div className="flex h-10 items-center gap-2.5 border-b px-3">
              <SearchIcon className="text-muted-foreground size-4 shrink-0" />
              <CommandInput
                placeholder={`Search ${items.length} items…`}
                className="placeholder:text-muted-foreground h-full w-full border-0 bg-transparent p-0 text-sm outline-hidden"
              />
            </div>
            <CommandList className="max-h-[min(24rem,60vh)] p-1.5">
              <CommandEmpty>Nothing matches that.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.slug}
                    value={`${item.label} ${item.slug}`}
                    onSelect={() => {
                      onChange(item.slug)
                      setOpen(false)
                    }}
                    className="gap-3 rounded-xl py-2"
                  >
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center text-xl">
                      {emojiFor(item.slug)}
                    </span>
                    <span className="truncate font-medium first-letter:uppercase">
                      {item.labelAttributive}
                    </span>
                    {item.hint ? (
                      <span className="text-muted-foreground tnum ml-auto shrink-0 font-mono text-xs">
                        {item.hint}
                      </span>
                    ) : null}
                    {item.slug === value ? <CheckIcon className="size-4 shrink-0" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Hidden on phones: two rows of shortcuts cost more screen than they
          save when the picker beside them already searches all of them. */}
      {quick?.map((slug) => {
        const item = items.find((i) => i.slug === slug)
        if (!item) return null
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onChange(slug)}
            aria-pressed={slug === value}
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex",
              slug === value
                ? "bg-accent text-accent-foreground border-transparent"
                : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden className="text-sm leading-none">
              {emojiFor(slug)}
            </span>
            <span className="first-letter:uppercase">{item.labelAttributive}</span>
          </button>
        )
      })}
    </div>
  )
}
