import { SiteFooter } from "@/components/site-footer"

/**
 * Everything except the home page. The home page sits outside this group
 * because it is sized to the viewport exactly and must not scroll — a footer
 * under it would defeat that.
 */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  )
}
