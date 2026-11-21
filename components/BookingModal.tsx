"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import {
  ALL_BOOKING_ITEMS,
  BOOKING_EQUIPMENT,
  BOOKING_ROOMS,
  BOOKING_STATUSES,
  TIME_SLOTS,
  TempahanRecord,
  getTodayDateString,
  toDateInputValue,
} from "@/lib/bookings";

export interface BookingFormPayload {
  nama_pemohon: string;
  item_tempahan: string;
  tarikh: string;
  slot_masa: string;
  status?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  editingRecord: TempahanRecord | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BookingFormPayload) => Promise<void>;
}

interface BookingFormContentProps {
  editingRecord: TempahanRecord | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BookingFormPayload) => Promise<void>;
}

function BookingFormContent({
  editingRecord,
  isSubmitting,
  onClose,
  onSubmit,
}: BookingFormContentProps) {
  const [namaPemohon, setNamaPemohon] = useState(
    editingRecord ? editingRecord.nama_pemohon : ""
  );
  const [itemTempahan, setItemTempahan] = useState<string>(
    editingRecord ? editingRecord.item_tempahan : ALL_BOOKING_ITEMS[0]
  );
  const [tarikh, setTarikh] = useState<string>(
    editingRecord ? toDateInputValue(editingRecord.tarikh) : getTodayDateString()
  );
  const [slotMasa, setSlotMasa] = useState<string>(
    editingRecord ? editingRecord.slot_masa : TIME_SLOTS[0]
  );
  const [status, setStatus] = useState<string>(
    editingRecord ? editingRecord.status : "Menunggu"
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = namaPemohon.trim();
    if (trimmedName.length < 2) {
      setFormError("Sila masukkan nama pemohon sekurang-kurangnya 2 aksara.");
      return;
    }
    if (!tarikh) {
      setFormError("Sila pilih tarikh tempahan.");
      return;
    }
    setFormError(null);

    const payload: BookingFormPayload = {
      nama_pemohon: trimmedName,
      item_tempahan: itemTempahan,
      tarikh,
      slot_masa: slotMasa,
    };
    if (editingRecord) {
      payload.status = status;
    }
    await onSubmit(payload);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2
            id="booking-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            {editingRecord
              ? `Kemaskini Tempahan #${editingRecord.id}`
              : "Tambah Tempahan Baru"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {editingRecord
              ? "Ubah maklumat permohonan tempahan ruang atau peralatan."
              : "Lengkapkan borang di bawah untuk merekod tempahan baharu."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Tutup borang"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4 px-6 py-5">
        {formError ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
          >
            {formError}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="nama_pemohon"
            className="block text-xs font-medium text-slate-700"
          >
            Nama Pemohon <span className="text-rose-600">*</span>
          </label>
          <input
            id="nama_pemohon"
            name="nama_pemohon"
            type="text"
            required
            maxLength={120}
            value={namaPemohon}
            onChange={(e) => setNamaPemohon(e.target.value)}
            placeholder="Contoh: Nurul Aina binti Hassan"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div>
          <label
            htmlFor="item_tempahan"
            className="block text-xs font-medium text-slate-700"
          >
            Item Tempahan (Ruang / Peralatan){" "}
            <span className="text-rose-600">*</span>
          </label>
          <select
            id="item_tempahan"
            name="item_tempahan"
            value={itemTempahan}
            onChange={(e) => setItemTempahan(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <optgroup label="Ruang Kampus">
              {BOOKING_ROOMS.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </optgroup>
            <optgroup label="Peralatan Studio & Sukan">
              {BOOKING_EQUIPMENT.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="tarikh"
              className="block text-xs font-medium text-slate-700"
            >
              Tarikh <span className="text-rose-600">*</span>
            </label>
            <input
              id="tarikh"
              name="tarikh"
              type="date"
              required
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="slot_masa"
              className="block text-xs font-medium text-slate-700"
            >
              Slot Masa <span className="text-rose-600">*</span>
            </label>
            <select
              id="slot_masa"
              name="slot_masa"
              value={slotMasa}
              onChange={(e) => setSlotMasa(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {editingRecord ? (
          <div>
            <label
              htmlFor="status"
              className="block text-xs font-medium text-slate-700"
            >
              Status Permohonan
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {BOOKING_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 whitespace-nowrap"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                <span>Menyimpan...</span>
              </>
            ) : editingRecord ? (
              <span>Simpan Perubahan</span>
            ) : (
              <span>Hantar Tempahan</span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export function BookingModal({
  isOpen,
  editingRecord,
  isSubmitting,
  onClose,
  onSubmit,
}: BookingModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          />
          <BookingFormContent
            key={editingRecord ? `edit-${editingRecord.id}` : "create"}
            editingRecord={editingRecord}
            isSubmitting={isSubmitting}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      ) : null}
    </AnimatePresence>
  );
}
