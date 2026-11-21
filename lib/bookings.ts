export const BOOKING_ROOMS = [
  "Bilik Perbincangan 1",
  "Bilik Perbincangan 2",
  "Makmal Komputer 1",
  "Makmal Komputer 2",
] as const;

export const BOOKING_EQUIPMENT = [
  "Kamera DSLR",
  "Tripod",
  "Bola Futsal",
  "Raket Badminton",
] as const;

export const ALL_BOOKING_ITEMS = [
  ...BOOKING_ROOMS,
  ...BOOKING_EQUIPMENT,
] as const;

export const TIME_SLOTS = [
  "8:00-10:00",
  "10:00-12:00",
  "14:00-16:00",
  "16:00-18:00",
] as const;

export const BOOKING_STATUSES = [
  "Menunggu",
  "Diluluskan",
  "Ditolak",
] as const;

export type BookingRoom = (typeof BOOKING_ROOMS)[number];
export type BookingEquipment = (typeof BOOKING_EQUIPMENT)[number];
export type BookingItem = (typeof ALL_BOOKING_ITEMS)[number];
export type TimeSlot = (typeof TIME_SLOTS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingCategory = "Ruang" | "Peralatan";

export interface TempahanRecord {
  id: number;
  nama_pemohon: string;
  item_tempahan: string;
  tarikh: string;
  slot_masa: string;
  status: string;
  createdAt: string;
}

export function getItemCategory(item: string): BookingCategory {
  if ((BOOKING_ROOMS as readonly string[]).includes(item)) {
    return "Ruang";
  }
  return "Peralatan";
}

export function isValidBookingItem(item: unknown): item is BookingItem {
  return (
    typeof item === "string" &&
    (ALL_BOOKING_ITEMS as readonly string[]).includes(item)
  );
}

export function isValidTimeSlot(slot: unknown): slot is TimeSlot {
  return (
    typeof slot === "string" &&
    (TIME_SLOTS as readonly string[]).includes(slot)
  );
}

export function isValidBookingStatus(status: unknown): status is BookingStatus {
  return (
    typeof status === "string" &&
    (BOOKING_STATUSES as readonly string[]).includes(status)
  );
}

export function parseBookingDate(input: unknown): Date | null {
  if (typeof input !== "string" || !input.trim()) {
    return null;
  }
  const trimmed = input.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateInputValue(isoDate: string): string {
  if (!isoDate) return getTodayDateString();
  return isoDate.slice(0, 10);
}

export function formatDisplayDate(isoDate: string): string {
  const datePart = isoDate.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}
