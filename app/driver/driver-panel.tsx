"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type ShareStatus = "idle" | "locating" | "sharing" | "error";

function createDriverCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomValues = new Uint8Array(12);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join("");
}

function createPublishToken() {
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => value.toString(16).padStart(2, "0")).join("");
}

export default function DriverPanel() {
  const [driverId, setDriverId] = useState("");
  const [publishToken, setPublishToken] = useState("");
  const [driverName, setDriverName] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copyLabel, setCopyLabel] = useState("คัดลอกลิงก์");
  const latestPosition = useRef<Coordinates | null>(null);
  const watchId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);
  const isSending = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      let savedId = localStorage.getItem("route-driver-id");
      if (!savedId) {
        savedId = createDriverCode();
        localStorage.setItem("route-driver-id", savedId);
      }
      let savedToken = localStorage.getItem("route-publish-token");
      if (!savedToken) {
        savedToken = createPublishToken();
        localStorage.setItem("route-publish-token", savedToken);
      }
      setDriverId(savedId);
      setPublishToken(savedToken);
      setDriverName(localStorage.getItem("route-driver-name") || "รถของฉัน");
      setShareUrl(`${window.location.origin}/track?driverId=${savedId}`);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  const sendPosition = useCallback(async (position: Coordinates) => {
    if (!driverId || !publishToken || !driverName.trim() || isSending.current) return;
    isSending.current = true;
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, publishToken, driverName, ...position }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "บันทึกตำแหน่งไม่สำเร็จ");
      }
      setLastUpdated(new Date());
      setStatus("sharing");
      setError("");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "ส่งตำแหน่งไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      isSending.current = false;
    }
  }, [driverId, driverName, publishToken]);

  const startSharing = useCallback(() => {
    if (activeRef.current) return;
    if (!driverId || !publishToken || !driverName.trim()) {
      setStatus("error");
      setError("กรุณาระบุชื่อรถและรอให้ระบบสร้างรหัสติดตามก่อนเริ่มแชร์");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("error");
      setError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("error");
      setError("การใช้ GPS ต้องเปิดเว็บผ่าน HTTPS หรือ localhost");
      return;
    }
    setError("");
    setStatus("locating");
    activeRef.current = true;
    setIsActive(true);
    const handleLocationError = (geoError: GeolocationPositionError) => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (intervalId.current !== null) window.clearInterval(intervalId.current);
      watchId.current = null;
      intervalId.current = null;
      activeRef.current = false;
      setIsActive(false);
      const messages: Record<number, string> = {
        1: "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ Location",
        2: "ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS แล้วลองอีกครั้ง",
        3: "ระบุตำแหน่งนานเกินไป กรุณาลองอีกครั้ง",
      };
      setStatus("error");
      setError(messages[geoError.code] || "เกิดข้อผิดพลาดขณะอ่านตำแหน่ง");
    };
    const updateLatestPosition = (position: GeolocationPosition) => {
      if (!activeRef.current) return;
      latestPosition.current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    };
    watchId.current = navigator.geolocation.watchPosition(
      updateLatestPosition,
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!activeRef.current) return;
        updateLatestPosition(position);
        void sendPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        intervalId.current = window.setInterval(() => {
          if (latestPosition.current) void sendPosition(latestPosition.current);
        }, 30_000);
      },
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }, [driverId, driverName, publishToken, sendPosition]);

  const stopSharing = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (intervalId.current !== null) window.clearInterval(intervalId.current);
    watchId.current = null;
    intervalId.current = null;
    activeRef.current = false;
    setIsActive(false);
    latestPosition.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (intervalId.current !== null) window.clearInterval(intervalId.current);
  }, []);

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLabel("คัดลอกแล้ว!");
      window.setTimeout(() => setCopyLabel("คัดลอกลิงก์"), 1800);
    } catch {
      setError("คัดลอกลิงก์ไม่สำเร็จ กรุณาคัดลอกจากช่องลิงก์");
    }
  };

  return (
    <div className="driver-layout">
      <section className="panel driver-panel">
        <div className="panel-topline"><span className="panel-label">ตั้งค่าการแชร์</span><span className="panel-step">01 / DRIVER</span></div>
        <label className="field-label" htmlFor="driver-name">ชื่อรถหรือชื่อคนขับ</label>
        <input
          id="driver-name"
          className="text-input"
          value={driverName}
          maxLength={40}
          onChange={(event) => {
            setDriverName(event.target.value);
            localStorage.setItem("route-driver-name", event.target.value);
          }}
          disabled={isActive}
          placeholder="เช่น รถตู้สายเหนือ"
        />
        <div className="code-heading"><label className="field-label" htmlFor="driver-code">รหัสสำหรับติดตาม</label><span className="private-tag">แชร์ให้ผู้โดยสาร</span></div>
        <div className="code-box">
          <span id="driver-code" className="driver-code">{driverId || "กำลังสร้างรหัส..."}</span>
          <button className="icon-button" onClick={() => {
            const newId = createDriverCode();
            const newToken = createPublishToken();
            localStorage.setItem("route-driver-id", newId);
            localStorage.setItem("route-publish-token", newToken);
            setDriverId(newId);
            setPublishToken(newToken);
            setShareUrl(`${window.location.origin}/track?driverId=${newId}`);
          }} disabled={isActive || !driverId} aria-label="สร้างรหัสใหม่" title="สร้างรหัสใหม่">↻</button>
        </div>
        <div className="share-link-row">
          <input className="text-input share-link-input" value={shareUrl} readOnly aria-label="ลิงก์สำหรับติดตามรถ" />
          <button className="button button-secondary copy-button" onClick={copyShareUrl} disabled={!driverId}>{copyLabel}</button>
        </div>
        <div className={`gps-status ${status === "sharing" ? "status-live" : status === "error" ? "status-error" : ""}`}>
          <span className="status-indicator" />
          <div><strong>{status === "sharing" ? "กำลังแชร์ตำแหน่ง" : status === "locating" ? "กำลังค้นหาตำแหน่ง GPS" : status === "error" ? "แชร์ตำแหน่งไม่สำเร็จ" : "ยังไม่ได้เริ่มแชร์"}</strong>
            <small>{status === "sharing" && lastUpdated ? `อัปเดตล่าสุด ${lastUpdated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : status === "locating" ? "โปรดอนุญาตการเข้าถึงตำแหน่ง" : "เปิด GPS และอนุญาตตำแหน่งเพื่อเริ่มต้น"}</small>
          </div>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        {isActive ? (
          <button className="button button-stop" onClick={stopSharing}><span aria-hidden="true">■</span> หยุดแชร์ตำแหน่ง</button>
        ) : (
          <button className="button button-primary start-button" onClick={startSharing} disabled={!driverId || !driverName.trim()}><span aria-hidden="true">⌖</span> เริ่มแชร์ตำแหน่ง</button>
        )}
        <p className="privacy-note"><span aria-hidden="true">ⓘ</span> ตำแหน่งจะถูกแชร์ให้ผู้ที่มีรหัสติดตามนี้เท่านั้น</p>
      </section>
      <aside className="driver-aside">
        <div className="aside-illustration" aria-hidden="true"><span className="illustration-road" /><span className="illustration-pin">⌖</span><span className="illustration-dot" /></div>
        <p className="eyebrow">วิธีใช้งาน</p>
        <h2>พร้อมแล้ว<br />ก็ออกเดินทางได้เลย</h2>
        <ol className="instruction-list">
          <li><span>1</span><p>กดปุ่ม <strong>เริ่มแชร์ตำแหน่ง</strong> แล้วอนุญาตให้เว็บเข้าถึง GPS</p></li>
          <li><span>2</span><p>ส่งรหัสหรือลิงก์ให้ผู้โดยสาร เพื่อเปิดดูตำแหน่งบนแผนที่</p></li>
          <li><span>3</span><p>เปิดหน้านี้ค้างไว้ตลอดการเดินทาง ระบบอัปเดตทุก 30 วินาที</p></li>
        </ol>
        <div className="tip-card"><span>✦</span><p>เพื่อให้ตำแหน่งแม่นยำ ควรเปิด GPS และอนุญาตการใช้งานตำแหน่งตลอดเวลา</p></div>
      </aside>
    </div>
  );
}
