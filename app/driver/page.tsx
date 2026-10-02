import DriverPanel from "./driver-panel";

export default function DriverPage() {
  return (
    <main className="tool-page">
      <div className="tool-heading">
        <p className="eyebrow"><span className="eyebrow-line" /> DRIVER PORTAL</p>
        <h1>แชร์ตำแหน่งรถ</h1>
        <p>เปิด GPS ค้างไว้ระหว่างเดินทาง ระบบจะส่งพิกัดล่าสุดทุก 30 วินาที</p>
      </div>
      <DriverPanel />
    </main>
  );
}
