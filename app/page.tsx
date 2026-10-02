import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> LIVE LOCATION, MADE SIMPLE</p>
          <h1>รู้ว่ารถอยู่ที่ไหน<br /><span>ในทุกช่วงเวลา</span></h1>
          <p className="hero-description">
            แชร์ตำแหน่งรถแบบเรียลไทม์ คนขับเปิดแชร์พิกัด ส่วนผู้โดยสารเปิดแผนที่ติดตามได้ทันที
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/driver">
              เริ่มแชร์ตำแหน่ง <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-secondary" href="/track">
              ดูตำแหน่งรถ <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-note"><span className="note-dot" /> อัปเดตพิกัดทุก 30 วินาที</div>
        </div>
        <div className="hero-visual" aria-label="ตัวอย่างแผนที่แสดงตำแหน่งรถ">
          <div className="map-grid" />
          <svg className="route-line" viewBox="0 0 600 460" role="img" aria-label="เส้นทางรถบนแผนที่">
            <path d="M94 390 C155 350 172 320 220 315 S295 333 323 279 S351 208 397 218 S465 198 485 137 S523 88 550 80" />
            <circle cx="94" cy="390" r="8" />
            <circle cx="550" cy="80" r="8" />
          </svg>
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <div className="map-label label-one">ถนนพหลโยธิน</div>
          <div className="map-label label-two">ลาดพร้าว</div>
          <div className="map-label label-three">สวนจตุจักร</div>
          <div className="map-pin"><span className="pin-halo" /><span className="pin-core">↗</span></div>
          <div className="map-card">
            <span className="vehicle-icon">↗</span>
            <span><strong>รถกำลังเดินทาง</strong><small>อัปเดตเมื่อสักครู่</small></span>
            <span className="live-pill"><i /> LIVE</span>
          </div>
          <div className="map-coordinates">13°49&apos;12.1&quot;N&nbsp; 100°33&apos;02.4&quot;E</div>
          <span className="map-scale">BANGKOK · THAILAND</span>
        </div>
      </section>
      <section className="steps-section">
        <div className="section-heading">
          <div><p className="eyebrow">เริ่มต้นได้ในไม่กี่ขั้นตอน</p><h2>ติดตามง่าย ทั้งคนขับและผู้โดยสาร</h2></div>
          <span className="section-index">01 — 02</span>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon driver-icon" aria-hidden="true">⌖</div>
            <h3>สำหรับคนขับ</h3>
            <p>เปิดแชร์ตำแหน่ง อนุญาตให้เข้าถึง GPS แล้วส่งรหัสติดตามให้ผู้โดยสาร</p>
            <Link href="/driver" className="text-link">ไปหน้าแชร์ตำแหน่ง <span aria-hidden="true">→</span></Link>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <div className="step-icon viewer-icon" aria-hidden="true">◎</div>
            <h3>สำหรับผู้โดยสาร</h3>
            <p>กรอกรหัสติดตามเพื่อดูตำแหน่งรถล่าสุดบน Google Maps ได้ทันที</p>
            <Link href="/track" className="text-link">ไปหน้าติดตามรถ <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>
      <footer className="site-footer">
        <span>ROUTE / 01</span><span>ตำแหน่งของคุณ อัปเดตอยู่เสมอ</span>
      </footer>
    </main>
  );
}
