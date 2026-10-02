import TrackPanel from "./track-panel";

export default function TrackPage() {
  return (
    <main className="tool-page track-page">
      <div className="tool-heading">
        <p className="eyebrow"><span className="eyebrow-line" /> PASSENGER PORTAL</p>
        <h1>ติดตามตำแหน่งรถ</h1>
        <p>กรอกรหัสที่ได้รับจากคนขับ เพื่อดูตำแหน่งรถล่าสุดบนแผนที่</p>
      </div>
      <TrackPanel />
    </main>
  );
}
