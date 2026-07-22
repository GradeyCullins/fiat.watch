import map from "./item-emoji.json"

/**
 * One emoji per item.
 *
 * Checked against the alternatives before choosing: of the five icon libraries
 * shadcn documents, Tabler has the best food coverage and still missed potato,
 * tomato, sugar, chicken, bacon, soda and fuel — seven of the first
 * twenty-five grocery terms tested. Phosphor missed thirteen. Icon libraries
 * are built for interfaces; emoji was built for food, and covers all 160.
 *
 * The trade-off is that it renders as Apple's art on a Mac and Google's on
 * Android. For a consumer price site that is fine — arguably better, since it
 * matches whatever the reader already sees everywhere else on their device.
 */
const EMOJI: Record<string, string> = map

export const emojiFor = (slug: string) => EMOJI[slug] ?? "🧾"
