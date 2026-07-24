"use client"

import * as React from "react"
import mapboxgl, { type GeoJSONSourceSpecification } from "mapbox-gl"
import { useTheme } from "next-themes"

import "mapbox-gl/dist/mapbox-gl.css"

import { formatUsd } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { emojiFor } from "@/lib/emoji"
import { AREA_POINT, METRO_POINT, STATE_AREA } from "@/lib/geo/us-areas"
import type { MapItem } from "@/lib/map-data"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/**
 * Sequential ramp, five steps, cheap → dear.
 *
 * Not `--chart-1..5`: those are categorical, chosen to be told apart, and a
 * choropleth needs an ordered scale where the position in the ramp *is* the
 * value. Runs cool to hot so "expensive" reads as hot without a legend.
 */
const RAMP = ["#1b4965", "#2a9d8f", "#8ab17d", "#e9c46a", "#e76f51"]

/**
 * Globe projection flattens to Mercator between z5 and z6 (the constants are
 * `GLOBE_ZOOM_THRESHOLD_MIN/MAX` in gl-js). Capping below that keeps it a globe
 * rather than letting it silently become a flat map mid-zoom.
 */
const MAX_ZOOM = 4.8

/**
 * The lower 48, as a bounding box.
 *
 * The camera fits to this rather than sitting at a fixed centre and zoom,
 * because a fixed zoom only frames the country at one window size: what fills
 * a 1440px desktop crops the Dakotas off a phone. Alaska and Hawaii are
 * deliberately outside the box — including them zooms the map out far enough
 * that the contiguous states become a smudge — so they are a pan away.
 */
const CONUS: [[number, number], [number, number]] = [
  [-125.5, 24.2],
  [-66.5, 49.6],
]

/*
 * The geometry is opaque to this file — it only ever reads and writes
 * `properties`. mapbox-gl bundles its own GeoJSON types rather than depending
 * on `@types/geojson`, and they are not re-exported under a name we can
 * import, so the source data is typed by what we touch and handed to
 * `addSource` as the spec type it expects.
 */
type StateFeature = { properties: Record<string, unknown> | null }
type StateCollection = { type: "FeatureCollection"; features: StateFeature[] }

/**
 * Keeps the country clear of the floating panels.
 *
 * The overlays sit on top of the canvas, so fitting to the raw container would
 * tuck the north-west under the heading card and the south-east under the
 * summary. Padding is proportional rather than fixed because the panels are
 * proportional too, and it is capped so a very tall window does not pad the
 * map into a stamp.
 */
function fitPadding(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect()
  const narrow = width < 640
  return {
    top: Math.min(narrow ? 240 : 150, height * 0.3),
    bottom: Math.min(narrow ? 190 : 120, height * 0.25),
    left: narrow ? 16 : Math.min(80, width * 0.06),
    right: narrow ? 16 : Math.min(80, width * 0.06),
  }
}

interface Marked {
  marker: mapboxgl.Marker
  price: HTMLElement
  emoji: HTMLElement
}

/** The five colour stops for one item, over the areas it actually has. */
function scaleFor(item: MapItem, areaSlugs: string[]) {
  const values = areaSlugs
    .map((slug) => item.readings[slug]?.value)
    .filter((v): v is number => v != null)
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  // A flat series (every area identical) would make an interpolate expression
  // with duplicate stops, which Mapbox rejects outright.
  return max > min ? { min, max } : { min, max: min + 1e-6 }
}

/**
 * `["match", ["get", key], "northeast", "#…", …]` — the geometry never changes,
 * only the colour a region maps to, so switching item is one `setPaintProperty`
 * and no `setData`. `setData` re-parses and re-tiles the whole FeatureCollection;
 * at 51 states with 13,500 vertices that is the difference between instant and
 * visibly janky.
 */
function fillExpression(item: MapItem, key: "region" | "division", areaSlugs: string[]) {
  const scale = scaleFor(item, areaSlugs)
  if (!scale) return "rgba(0,0,0,0)"

  const stops: (string | number)[] = []
  for (const slug of areaSlugs) {
    const value = item.readings[slug]?.value
    if (value == null) continue
    const t = (value - scale.min) / (scale.max - scale.min)
    stops.push(slug, RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))]!)
  }
  if (!stops.length) return "rgba(0,0,0,0)"

  // Areas with no reading for this item fall through to the transparent
  // fallback rather than being drawn as if they were zero.
  return ["match", ["get", key], ...stops, "rgba(0,0,0,0)"] as unknown as string
}

export function PriceGlobe({
  items,
  regionSlugs,
  divisionSlugs,
  selected,
  className,
}: {
  items: MapItem[]
  regionSlugs: string[]
  divisionSlugs: string[]
  selected: string
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const markersRef = React.useRef(new globalThis.Map<string, Marked>())
  const [ready, setReady] = React.useState(false)
  const [failed, setFailed] = React.useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  const item = items.find((i) => i.slug === selected) ?? items[0]

  React.useEffect(() => {
    // StrictMode mounts twice. Without this guard that is two `Map` objects and
    // two billable map loads for one page view.
    if (mapRef.current || !containerRef.current) return
    if (!TOKEN) {
      setFailed("NEXT_PUBLIC_MAPBOX_TOKEN is not set")
      return
    }

    const map = new mapboxgl.Map({
      accessToken: TOKEN,
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      projection: "globe",
      // A valid camera up front, then `fitBounds` once the style is up (see
      // `style.load`). Passing `bounds` to the constructor instead looked
      // equivalent and was not: the style loaded, the icon set loaded, and the
      // map then issued zero tile requests because the camera never resolved
      // under globe projection. A blank canvas with no error in the console.
      center: [-98.5, 39.5],
      zoom: 3,
      maxZoom: MAX_ZOOM,
      antialias: true,
      attributionControl: true,
      config: {
        // A basemap that argues with the data is a basemap turned up too loud.
        basemap: {
          theme: "monochrome",
          show3dObjects: false,
          showPointOfInterestLabels: false,
          showTransitLabels: false,
          showRoadLabels: false,
        },
      },
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
    map.on("error", (e) => setFailed(e.error?.message ?? "Map failed to load"))

    /*
     * `style.load`, not `load`. `load` fires once for the first style only, so
     * wiring setup to it means a later `setStyle` silently discards every
     * source and layer and never puts them back.
     */
    map.on("style.load", async () => {
      if (map.getSource("states")) return

      const res = await fetch("/geo/us-states.geojson")
      const geo = (await res.json()) as StateCollection

      // The census region and division a state belongs to are what carry the
      // price; the geometry file stays a plain, cacheable boundary file.
      for (const feature of geo.features) {
        const code = (feature.properties?.state as string) ?? ""
        const area = STATE_AREA[code]
        feature.properties = { ...feature.properties, ...area }
      }

      map.addSource("states", {
        type: "geojson",
        data: geo as unknown as GeoJSONSourceSpecification["data"],
      })
      map.addLayer({
        id: "states-fill",
        type: "fill",
        source: "states",
        slot: "bottom",
        paint: {
          "fill-color": "rgba(0,0,0,0)",
          // Standard lights custom layers with its 3D lighting environment, and
          // the default emissive strength of 0 means the night preset dims the
          // data colours. 1 renders the ramp at its literal value.
          "fill-emissive-strength": 1,
          "fill-opacity": 0.75,
        },
      })
      map.addLayer({
        id: "states-line",
        type: "line",
        source: "states",
        slot: "bottom",
        paint: { "line-color": "rgba(255,255,255,0.22)", "line-width": 0.5 },
      })

      frame()
      setReady(true)
    })

    /*
     * Mapbox listens for `window` resize on its own, but not for the container
     * changing under a stable window — which is exactly what happens when an
     * overlay panel opens, the disclosure expands, or a phone rotates its
     * address bar away. Without this the canvas keeps its old size and the
     * globe sits offset inside its box.
     */
    /** Fit the lower 48 into whatever space the panels leave. */
    function frame(animate = false) {
      const el = containerRef.current
      if (!el) return
      map.fitBounds(CONUS, { padding: fitPadding(el), duration: animate ? 300 : 0 })
    }

    // Re-frame on resize, but only until the reader takes the wheel — once
    // they have panned or zoomed, snapping back to the default view on every
    // container change would be the map arguing with them.
    let touched = false
    for (const event of ["dragstart", "zoomstart", "rotatestart"] as const) {
      map.on(event, (e) => {
        if ((e as { originalEvent?: unknown }).originalEvent) touched = true
      })
    }

    const observer = new ResizeObserver(() => {
      map.resize()
      if (!touched) frame()
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      markersRef.current.forEach((m) => m.marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
      setReady(false)
    }
    // The map is created once. An `item` dependency here would tear down and
    // rebuild it on every selection — a billable map load per click.
  }, [])

  /* Theme: re-light in place. Standard's `lightPreset` avoids `setStyle`, which
     would discard the choropleth and force re-adding everything. */
  React.useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const dark = resolvedTheme === "dark"
    map.setConfigProperty("basemap", "lightPreset", dark ? "night" : "day")
    map.setFog(
      dark
        ? {
            "space-color": "rgb(9,11,20)",
            "horizon-blend": 0.02,
            "star-intensity": 0.55,
            "high-color": "rgb(36,92,223)",
          }
        : {
            "space-color": "rgb(222,235,255)",
            "horizon-blend": 0.06,
            "star-intensity": 0,
            "high-color": "rgb(150,190,255)",
          },
    )
  }, [resolvedTheme, ready])

  /* Selection: repaint, don't rebuild. */
  React.useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !item) return

    // Divisions are the finer cut, but only 8 items publish them; the rest get
    // the 4 census regions, which 112 items have in full.
    const useDivisions = item.kinds.includes("division")
    const key = useDivisions ? "division" : "region"
    const slugs = useDivisions ? divisionSlugs : regionSlugs
    map.setPaintProperty("states-fill", "fill-color", fillExpression(item, key, slugs))

    /*
     * Every area with a reading gets a pin, not just the cities.
     *
     * Only twelve of the catalogue's items have city series, so pinning metros
     * alone meant that picking bread gave you four coloured shapes and not one
     * number — the shading said "more" and "less" without ever saying how
     * much. Regions and divisions now carry a label too, at the anchors in
     * `AREA_POINT`, and the region pin is drawn larger so it does not read as
     * one more city.
     */
    /*
     * Every pin the map could ever show, each marked with whether it belongs
     * on the map *now*. The loop below must visit the ones that do not, or
     * they are never taken down: an earlier version built this list from the
     * active layer only, so switching from a division item to a region item
     * left the nine division labels sitting under the four region ones — 13
     * pins claiming to be 4.
     */
    type Pin = { slug: string; point: { lng: number; lat: number }; isArea: boolean }
    const points: Pin[] = [
      ...Object.entries(METRO_POINT).map(([slug, point]) => ({ slug, point, isArea: false })),
      ...Object.entries(AREA_POINT).map(([slug, point]) => ({ slug, point, isArea: true })),
    ]

    for (const { slug, point, isArea } of points) {
      // Regions and divisions are alternatives, never both at once, or the two
      // sets of labels overlap and contradict each other.
      const inLayer = !isArea || slugs.includes(slug)
      const reading = inLayer ? item.readings[slug] : undefined
      const existing = markersRef.current.get(slug)

      if (!reading) {
        existing?.marker.remove()
        markersRef.current.delete(slug)
        continue
      }

      if (existing) {
        // Mutating the DOM beats recreating the marker: no re-layout, no
        // flicker, and the popup stays attached.
        existing.price.textContent = formatUsd(reading.value)
        existing.emoji.textContent = emojiFor(item.slug)
        continue
      }

      const el = document.createElement("div")
      el.className = isArea ? "metro-pin metro-pin-area" : "metro-pin"
      const emoji = document.createElement("span")
      emoji.className = "metro-pin-emoji"
      emoji.textContent = emojiFor(item.slug)
      const price = document.createElement("span")
      price.className = "metro-pin-price tnum"
      price.textContent = formatUsd(reading.value)
      el.append(emoji, price)

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
      markersRef.current.set(slug, { marker, price, emoji })
    }
  }, [item, ready, regionSlugs, divisionSlugs])

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="bg-muted h-full w-full" />
      {failed ? (
        <div className="bg-card/95 absolute inset-0 grid place-items-center p-6 text-center">
          <p className="text-muted-foreground max-w-sm text-sm">
            The map could not load ({failed}). Every figure it would show is in the table below.
          </p>
        </div>
      ) : null}
    </div>
  )
}
