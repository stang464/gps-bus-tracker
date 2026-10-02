import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getLocation, LocationAuthorizationError, saveLocation, type LocationRecord } from "@/lib/location-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDriverId(value: string | null) {
  const driverId = value?.trim().toUpperCase() || "";
  return /^[A-Z0-9-]{4,12}$/.test(driverId) ? driverId : null;
}

export async function GET(request: NextRequest) {
  const driverId = normalizeDriverId(request.nextUrl.searchParams.get("driverId"));
  if (!driverId) {
    return Response.json({ error: "กรุณาระบุรหัสติดตามที่ถูกต้อง" }, { status: 400 });
  }

  try {
    const location = await getLocation(driverId);
    if (!location) {
      return Response.json({ error: "ยังไม่พบตำแหน่งรถสำหรับรหัสนี้" }, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return Response.json(location, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to read driver location:", error);
    return Response.json({ error: "เกิดข้อผิดพลาดในการอ่านตำแหน่งรถ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลที่ส่งมาไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "ข้อมูลตำแหน่งไม่ถูกต้อง" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const driverId = normalizeDriverId(typeof input.driverId === "string" ? input.driverId : null);
  const driverName = typeof input.driverName === "string" ? input.driverName.trim().slice(0, 40) : "";
  const publishToken = typeof input.publishToken === "string" ? input.publishToken : "";
  const latitude = input.latitude;
  const longitude = input.longitude;
  const accuracy = input.accuracy;

  if (
    !driverId ||
    !/^[a-f0-9]{64}$/i.test(publishToken) ||
    !driverName ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof accuracy !== "number" ||
    !Number.isFinite(accuracy) ||
    accuracy < 0
  ) {
    return Response.json({ error: "กรุณาตรวจสอบรหัส ชื่อรถ และพิกัด GPS" }, { status: 400 });
  }

  const location: LocationRecord = {
    driverId,
    driverName,
    latitude,
    longitude,
    accuracy,
    updatedAt: new Date().toISOString(),
  };

  try {
    const publishTokenHash = createHash("sha256").update(publishToken).digest("hex");
    await saveLocation(location, publishTokenHash);
    return Response.json({ success: true, updatedAt: location.updatedAt }, { status: 201 });
  } catch (error) {
    if (error instanceof LocationAuthorizationError) {
      return Response.json({ error: "ไม่มีสิทธิ์อัปเดตตำแหน่งของรหัสนี้" }, { status: 403 });
    }
    console.error("Failed to save driver location:", error);
    return Response.json({ error: "เกิดข้อผิดพลาดในการบันทึกตำแหน่งรถ" }, { status: 500 });
  }
}
