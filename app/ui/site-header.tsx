import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Route home">
        <span className="brand-mark" aria-hidden="true">R<span>.</span></span>
        <span className="brand-name">ROUTE<span> / TRACKER</span></span>
      </Link>
      <nav className="main-nav" aria-label="เมนูหลัก">
        <Link href="/driver">คนขับ</Link>
        <Link href="/track">ติดตามรถ</Link>
      </nav>
      <Link className="header-action" href="/track">ค้นหารถ <span aria-hidden="true">↗</span></Link>
    </header>
  );
}
