"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { TempahanRecord, formatDisplayDate } from "@/lib/bookings";

interface DeleteConfirmModalProps {
  record: TempahanRecord | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteConfirmModal({
  record,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!record) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isDeleting) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [record, isDeleting, onCancel]);

  return (
    <AnimatePresence>
      {record ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!isDeleting) onCancel();
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="delete-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Padam Rekod Tempahan #{record.id}?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tindakan ini akan memadam rekod tempahan secara kekal dan
                  tidak boleh dikembalikan.
                </p>

                <div className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {record.nama_pemohon}
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    {record.item_tempahan} ·{" "}
                    <span className="font-mono">
                      {formatDisplayDate(record.tarikh)}
                    </span>{" "}
                    · <span className="font-mono">{record.slot_masa}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => onConfirm(record.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap"
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Memadam...</span>
                  </>
                ) : (
                  <span>Ya, Padam Rekod</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
