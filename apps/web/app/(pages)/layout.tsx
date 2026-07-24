/**
 * Every page, including the home page. Route groups do not appear in the URL.
 *
 * The footer is gone for now. Note what left with it: it was the only link to
 * `/sitemap`, and one of two crawl paths into the long tail. `sitemap.xml`
 * still lists every URL, so nothing is orphaned to a crawler — but nothing on
 * the site links to `/sitemap` any more.
 */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>
}
