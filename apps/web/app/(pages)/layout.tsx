import { SiteFooter } from "@/components/site-footer"

/**
 * Every page, including the home page. The group exists only so the footer is
 * declared once; route groups do not appear in the URL.
 */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  )
}
