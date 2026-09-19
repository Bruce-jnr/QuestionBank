import PublicLayout from '../components/PublicLayout'

export default function NotFoundPage() {
  return <PublicLayout><section className="not-found-page"><span>404</span><h1>This page could not be found.</h1><p>The link may be outdated, or the page may have moved.</p><div><a href="/">Return home</a><a href="/study-guide">Browse study guides</a></div></section></PublicLayout>
}
