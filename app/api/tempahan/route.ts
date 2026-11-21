import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isValidBookingItem,
  isValidBookingStatus,
  isValidTimeSlot,
  parseBookingDate,
} from "@/lib/bookings";

export const dynamic = "force-dynamic";

function handleDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error:
          "Sambungan pangkalan data gagal. Sila pastikan DATABASE_URL telah dikonfigurasi dengan betul.",
      },
      { status: 503 }
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: `${fallbackMessage} (Kod: ${error.code})` },
      { status: 400 }
    );
  }
  console.error("Tempahan API Error:", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function GET() {
  try {
    const records = await prisma.tempahan.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return NextResponse.json({ data: records }, { status: 200 });
  } catch (error) {
    return handleDatabaseError(error, "Gagal memuat turun senarai tempahan.");
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format JSON permintaan tidak sah." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Data tempahan tidak sah." },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  const rawNama = payload.nama_pemohon;
  if (typeof rawNama !== "string" || !rawNama.trim()) {
    return NextResponse.json(
      { error: "Nama pemohon wajib diisi." },
      { status: 400 }
    );
  }
  const nama_pemohon = rawNama.trim();
  if (nama_pemohon.length < 2 || nama_pemohon.length > 120) {
    return NextResponse.json(
      { error: "Nama pemohon mestilah antara 2 hingga 120 aksara." },
      { status: 400 }
    );
  }

  if (!isValidBookingItem(payload.item_tempahan)) {
    return NextResponse.json(
      { error: "Item tempahan yang dipilih tidak sah." },
      { status: 400 }
    );
  }

  const tarikh = parseBookingDate(payload.tarikh);
  if (!tarikh) {
    return NextResponse.json(
      { error: "Tarikh tempahan tidak sah. Gunakan format YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (!isValidTimeSlot(payload.slot_masa)) {
    return NextResponse.json(
      { error: "Slot masa yang dipilih tidak sah." },
      { status: 400 }
    );
  }

  let status = "Menunggu";
  if (payload.status !== undefined) {
    if (!isValidBookingStatus(payload.status)) {
      return NextResponse.json(
        { error: "Status tempahan tidak sah." },
        { status: 400 }
      );
    }
    status = payload.status;
  }

  try {
    const created = await prisma.tempahan.create({
      data: {
        nama_pemohon,
        item_tempahan: payload.item_tempahan,
        tarikh,
        slot_masa: payload.slot_masa,
        status,
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, "Gagal menyimpan tempahan baharu.");
  }
}
