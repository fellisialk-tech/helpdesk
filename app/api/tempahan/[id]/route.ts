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

function parseId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) {
    return null;
  }
  const numericId = Number(rawId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return null;
  }
  return numericId;
}

function handleMutationError(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error:
          "Sambungan pangkalan data gagal. Sila pastikan DATABASE_URL telah dikonfigurasi.",
      },
      { status: 503 }
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Rekod tempahan tidak ditemui." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: `${fallbackMessage} (Kod: ${error.code})` },
      { status: 400 }
    );
  }
  console.error("Tempahan [id] API Error:", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseId(id);
  if (numericId === null) {
    return NextResponse.json(
      { error: "ID tempahan tidak sah." },
      { status: 400 }
    );
  }

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
      { error: "Data kemas kini tidak sah." },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;
  const updateData: Prisma.TempahanUpdateInput = {};

  if (payload.nama_pemohon !== undefined) {
    if (
      typeof payload.nama_pemohon !== "string" ||
      !payload.nama_pemohon.trim()
    ) {
      return NextResponse.json(
        { error: "Nama pemohon tidak boleh kosong." },
        { status: 400 }
      );
    }
    const trimmedName = payload.nama_pemohon.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      return NextResponse.json(
        { error: "Nama pemohon mestilah antara 2 hingga 120 aksara." },
        { status: 400 }
      );
    }
    updateData.nama_pemohon = trimmedName;
  }

  if (payload.item_tempahan !== undefined) {
    if (!isValidBookingItem(payload.item_tempahan)) {
      return NextResponse.json(
        { error: "Item tempahan yang dipilih tidak sah." },
        { status: 400 }
      );
    }
    updateData.item_tempahan = payload.item_tempahan;
  }

  if (payload.tarikh !== undefined) {
    const parsedDate = parseBookingDate(payload.tarikh);
    if (!parsedDate) {
      return NextResponse.json(
        { error: "Tarikh tempahan tidak sah." },
        { status: 400 }
      );
    }
    updateData.tarikh = parsedDate;
  }

  if (payload.slot_masa !== undefined) {
    if (!isValidTimeSlot(payload.slot_masa)) {
      return NextResponse.json(
        { error: "Slot masa yang dipilih tidak sah." },
        { status: 400 }
      );
    }
    updateData.slot_masa = payload.slot_masa;
  }

  if (payload.status !== undefined) {
    if (!isValidBookingStatus(payload.status)) {
      return NextResponse.json(
        { error: "Status tempahan tidak sah." },
        { status: 400 }
      );
    }
    updateData.status = payload.status;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Tiada medan sah untuk dikemas kini." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.tempahan.update({
      where: { id: numericId },
      data: updateData,
    });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return handleMutationError(error, "Gagal mengemas kini rekod tempahan.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseId(id);
  if (numericId === null) {
    return NextResponse.json(
      { error: "ID tempahan tidak sah." },
      { status: 400 }
    );
  }

  try {
    await prisma.tempahan.delete({
      where: { id: numericId },
    });
    return NextResponse.json(
      { message: "Tempahan berjaya dipadam.", id: numericId },
      { status: 200 }
    );
  } catch (error) {
    return handleMutationError(error, "Gagal memadam rekod tempahan.");
  }
}
