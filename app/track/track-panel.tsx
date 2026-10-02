"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type LocationRecord = {
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: string;
};

type LoadState = "idle" | "loading" | "found" | "not-found" | "error";

export default function TrackPanel() {
  const [driverId, setDriverId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  const loadLocation = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/locations?driverId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (response.status === 404) {
        setLocation(null);
        setState("not-found");
        return;
      }
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "โหลดตำแหน่งไม่สำเร็จ");
      }
      setLocation((await response.json()) as LocationRecord);
      setNow(Date.now());
      setState("found");
      setError("");
    } catch (cause) {
      setState("error");
      setError(cause instanceof Error ? cause.message : "เชื่อมต่อระบบไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    const initialId = new URLSearchParams(window.location.search).get("driverId")?.trim().toUpperCase() || "";
    if (!initialId) return;
    const initialize = window.setTimeout(() => {
      setDriverId(initialId);
      setActiveId(initialId);
      setState("loading");
      void loadLocation(initialId);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [loadLocation]);

  useEffect(() => {
    if (!activeId) return;
    const interval = window.setInterval(() => {
      setNow(Date.now());
      void loadLocation(activeId);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [activeId, loadLocation]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedId = driverId.trim().toUpperCase();
    if (!normalizedId) return;
    window.history.replaceState(null, "", `/track?driverId=${encodeURIComponent(normalizedId)}`);
    setDriverId(normalizedId);
    setActiveId(normalizedId);
    setLocation(null);
    setState("loading");
    setError("");
    void loadLocation(normalizedId);
  };

  const isLive = location ? now - new Date(location.updatedAt).getTime() < 90_000 : false;
  const mapUrl = location
    ? `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=16&output=embed`
    : "";

  return (
    <div className="track-layout">
      <section className="panel track-search-panel">
        <div className="panel-topline"><span className="panel-label">ค้นหาตำแหน่งรถ</span><span className="panel-step">01 / TRACK</span></div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="tracking-code">รหัสติดตามรถ</label>
          <div className="search-row">
            <input id="tracking-code" className="text-input code-input" value={driverId} onChange={(event) => setDriverId(event.target.value.toUpperCase())} placeholder="เช่น 8K4X2MNP5Q7R" autoCapitalize="characters" autoComplete="off" maxLength={12} />
            <button className="button button-primary search-button" type="submit" disabled={!driverId.trim()}>ค้นหารถ <span aria-hidden="true">→</span></button>
          </div>
        </form>
        <div className="tracking-status">
          <div className={`status-symbol ${state === "found" ? "symbol-found" : state === "not-found" || state === "error" ? "symbol-error" : ""}`} aria-hidden="true">{state === "loading" ? "…" : state === "found" ? "⌖" : state === "not-found" || state === "error" ? "!" : "◎"}</div>
          <div className="tracking-status-copy">
            <strong>{state === "loading" ? "กำลังค้นหาตำแหน่งรถ" : state === "found" && location ? location.driverName : state === "not-found" ? "ยังไม่พบตำแหน่งรถ" : state === "error" ? "ไม่สามารถโหลดตำแหน่งได้" : "กรอกรหัสเพื่อติดตามรถ"}</strong>
            <span>{state === "found" && location ? `รหัส ${location.driverId} · ${isLive ? "กำลังเดินทาง" : "ตำแหน่งล่าสุด"}` : state === "not-found" ? "ตรวจสอบรหัส หรือลองใหม่เมื่อคนขับเริ่มแชร์ตำแหน่ง" : state === "error" ? error : "ตำแหน่งจะอัปเดตอัตโนมัติทุก 10 วินาที"}</span>
          </div>
          {state === "found" && <span className={`live-pill tracking-live ${isLive ? "" : "offline-pill"}`}><i />{isLive ? "LIVE" : "OFFLINE"}</span>}
        </div>
        {state === "found" && location && (
          <>
            <div className="location-detail">
              <div><span>ละติจูด</span><strong>{location.latitude.toFixed(6)}</strong></div>
              <div><span>ลองจิจูด</span><strong>{location.longitude.toFixed(6)}</strong></div>
              <div><span>ความแม่นยำ GPS</span><strong>±{Math.round(location.accuracy)} ม.</strong></div>
            </div>
            <div className="map-frame">
              <iframe title={`แผนที่ตำแหน่งรถ ${location.driverName}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              <span className="map-update">อัปเดต {new Date(location.updatedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
            <a className="open-map-link" href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer">เปิดใน Google Maps <span aria-hidden="true">↗</span></a>
          </>
        )}
        {state === "idle" && (
          <div className="map-placeholder">
            <div className="placeholder-map-grid" /><span className="placeholder-pin">⌖</span>
            <span className="placeholder-caption">แผนที่จะแสดงตำแหน่งรถที่นี่</span>
          </div>
        )}
        {state === "not-found" && (
          <div className="empty-map"><span aria-hidden="true">⌖</span><strong>ยังไม่มีพิกัดที่แชร์</strong><p>ให้คนขับเปิดแชร์ตำแหน่งก่อน แล้วลองค้นหาอีกครั้ง</p></div>
        )}
      </section>
      <aside className="track-aside">
        <div className="tracking-card"><div className="tracking-card-top"><span className="tracking-card-icon">⌖</span><span className="live-pill"><i /> LIVE TRACKING</span></div><div className="tracking-card-number">30<span>sec</span></div><h2>ตำแหน่งอัปเดต<br />ทุก 30 วินาที</h2><p>เห็นตำแหน่งล่าสุดของรถ พร้อมระดับความแม่นยำ GPS</p><div className="card-divider" /><div className="refresh-row"><span className="refresh-icon">↻</span><span>หน้านี้ตรวจสอบตำแหน่งทุก 10 วินาที</span></div></div>
        <div className="help-card"><span className="help-icon">?</span><div><strong>ยังไม่มีรหัสติดตาม?</strong><p>ขอรหัสหรือลิงก์ติดตามจากคนขับโดยตรง</p></div></div>
      </aside>
    </div>
  );
}
