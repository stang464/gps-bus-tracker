import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";

export type LocationRecord = {
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: string;
};

type StoredLocationRecord = LocationRecord & { publishTokenHash: string };
type LocationIndex = Record<string, StoredLocationRecord>;

export class LocationAuthorizationError extends Error {
  constructor() {
    super("Invalid publisher token");
    this.name = "LocationAuthorizationError";
  }
}

const storeDirectory = process.env.LOCATION_STORE_PATH || path.join(process.cwd(), ".data");
const storeFile = path.join(storeDirectory, "locations.json");
let writeQueue: Promise<void> = Promise.resolve();

async function readLocations(): Promise<LocationIndex> {
  try {
    return JSON.parse(await readFile(storeFile, "utf8")) as LocationIndex;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function getLocation(driverId: string) {
  const locations = await readLocations();
  const storedLocation = locations[driverId];
  if (!storedLocation) return null;
  return {
    driverId: storedLocation.driverId,
    driverName: storedLocation.driverName,
    latitude: storedLocation.latitude,
    longitude: storedLocation.longitude,
    accuracy: storedLocation.accuracy,
    updatedAt: storedLocation.updatedAt,
  };
}

export async function saveLocation(location: LocationRecord, publishTokenHash: string) {
  const operation = writeQueue.then(async () => {
    await mkdir(storeDirectory, { recursive: true });
    const locations = await readLocations();
    const existing = locations[location.driverId];
    if (existing) {
      const existingHash = Buffer.from(existing.publishTokenHash || "");
      const incomingHash = Buffer.from(publishTokenHash);
      if (existingHash.length !== incomingHash.length || !timingSafeEqual(existingHash, incomingHash)) {
        throw new LocationAuthorizationError();
      }
    }
    locations[location.driverId] = { ...location, publishTokenHash };
    const temporaryFile = path.join(storeDirectory, `.locations-${process.pid}.tmp`);
    await writeFile(temporaryFile, JSON.stringify(locations), "utf8");
    await rename(temporaryFile, storeFile);
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  await operation;
}
