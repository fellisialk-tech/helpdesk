"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  ALL_BOOKING_ITEMS,
  BOOKING_EQUIPMENT,
  BOOKING_ROOMS,
  BOOKING_STATUSES,
  TempahanRecord,
  formatDisplayDate,
  getItemCategory,
  getTodayDateString,
} from "@/lib/bookings";
import { StatusBadge } from "@/components/StatusBadge";
import {
  BookingFormPayload,
  BookingModal,
} from "@/components/BookingModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ToastMessage, ToastStack } from "@/components/ToastStack";

type CategoryFilter = "Semua" | "Ruang" | "Peralatan";

export default function ResourceBookingDashboard() {
  const [bookings, setBookings] = useState<TempahanRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Semua");
  const [itemFilter, setItemFilter] = useState<string>("Semua");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<TempahanRecord | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<TempahanRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: "success" | "error", title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setFetchError(null);
    try {
      const res = await fetch("/api/tempahan", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal memuat turun rekod tempahan.");
      }
      setBookings(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ralat rangkaian semasa memuat turun data.";
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      try {
        const res = await fetch("/api/tempahan", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Gagal memuat turun rekod tempahan.");
        }
        if (!cancelled) {
          setBookings(Array.isArray(json.data) ? json.data : []);
          setFetchError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Ralat rangkaian semasa memuat turun data.";
          setFetchError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void fetchInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayStr = getTodayDateString();

  const summary = useMemo(() => {
    let todayTotal = 0;
    let todayRooms = 0;
    let todayEquipment = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    for (const row of bookings) {
      const rowDate = row.tarikh.slice(0, 10);
      if (rowDate === todayStr) {
        todayTotal += 1;
        if (getItemCategory(row.item_tempahan) === "Ruang") {
          todayRooms += 1;
        } else {
          todayEquipment += 1;
        }
      }
      if (row.status === "Menunggu") {
        pendingCount += 1;
      } else if (row.status === "Diluluskan") {
        approvedCount += 1;
      }
    }

    return {
      todayTotal,
      todayRooms,
      todayEquipment,
      pendingCount,
      approvedCount,
      totalCount: bookings.length,
    };
  }, [bookings, todayStr]);

  const availableItemOptions = useMemo(() => {
    if (categoryFilter === "Ruang") return [...BOOKING_ROOMS];
    if (categoryFilter === "Peralatan") return [...BOOKING_EQUIPMENT];
    return [...ALL_BOOKING_ITEMS];
  }, [categoryFilter]);

  function handleCategoryChange(nextCategory: CategoryFilter) {
    setCategoryFilter(nextCategory);
    if (itemFilter !== "Semua") {
      const itemCat = getItemCategory(itemFilter);
      if (nextCategory !== "Semua" && itemCat !== nextCategory) {
        setItemFilter("Semua");
      }
    }
  }

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return bookings.filter((row) => {
      const category = getItemCategory(row.item_tempahan);
      if (categoryFilter !== "Semua" && category !== categoryFilter) {
        return false;
      }
      if (itemFilter !== "Semua" && row.item_tempahan !== itemFilter) {
        return false;
      }
      if (statusFilter !== "Semua" && row.status !== statusFilter) {
        return false;
      }
      if (query) {
        const matchesName = row.nama_pemohon.toLowerCase().includes(query);
        const matchesItem = row.item_tempahan.toLowerCase().includes(query);
        const matchesId = String(row.id) === query.replace(/^#/, "");
        if (!matchesName && !matchesItem && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, categoryFilter, itemFilter, statusFilter, searchQuery]);

  const hasActiveFilters =
    categoryFilter !== "Semua" ||
    itemFilter !== "Semua" ||
    statusFilter !== "Semua" ||
    searchQuery.trim() !== "";

  function resetFilters() {
    setCategoryFilter("Semua");
    setItemFilter("Semua");
    setStatusFilter("Semua");
    setSearchQuery("");
  }

  function openCreateModal() {
    setEditingRecord(null);
    setIsModalOpen(true);
  }

  function openEditModal(record: TempahanRecord) {
    setEditingRecord(record);
    setIsModalOpen(true);
  }

  async function handleSaveBooking(payload: BookingFormPayload) {
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingRecord);
      const endpoint = isEdit
        ? `/api/tempahan/${editingRecord!.id}`
        : "/api/tempahan";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal menyimpan tempahan.");
      }

      const saved: TempahanRecord = json.data;
      if (isEdit) {
        setBookings((prev) =>
          prev.map((item) => (item.id === saved.id ? saved : item))
        );
        pushToast(
          "success",
          "Tempahan dikemas kini",
          `Rekod #${saved.id} (${saved.nama_pemohon}) berjaya disimpan.`
        );
      } else {
        setBookings((prev) => [saved, ...prev]);
        pushToast(
          "success",
          "Tempahan baharu direkodkan",
          `${saved.item_tempahan} untuk ${saved.nama_pemohon}.`
        );
      }
      setIsModalOpen(false);
      setEditingRecord(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Operasi gagal dilaksanakan.";
      pushToast("error", "Gagal menyimpan rekod", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickStatus(
    record: TempahanRecord,
    nextStatus: "Diluluskan" | "Ditolak"
  ) {
    if (record.status === nextStatus || updatingId !== null) return;
    setUpdatingId(record.id);
    try {
      const res = await fetch(`/api/tempahan/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal mengemas kini status tempahan.");
      }
      const updated: TempahanRecord = json.data;
      setBookings((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      pushToast(
        "success",
        nextStatus === "Diluluskan"
          ? "Tempahan diluluskan"
          : "Tempahan ditolak",
        `#${updated.id} · ${updated.nama_pemohon} (${updated.item_tempahan})`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengemas kini status.";
      pushToast("error", "Kemas kini status gagal", message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmDelete(id: number) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tempahan/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal memadam rekod tempahan.");
      }
      setBookings((prev) => prev.filter((item) => item.id !== id));
      pushToast(
        "success",
        "Rekod dipadam",
        `Tempahan #${id} telah berjaya dikeluarkan daripada sistem.`
      );
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memadam rekod.";
      pushToast("error", "Padam rekod gagal", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar: 3-zone single-row header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg"
          >
            Tempahan Kampus
          </Link>

          <nav
            aria-label="Penapis pantas kategori"
            className="hidden items-center gap-6 md:flex"
          >
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("Semua");
                setItemFilter("Semua");
                setStatusFilter("Semua");
              }}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === "Semua" && statusFilter === "Semua"
                  ? "border-blue-700 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Rekod
            </button>
            <button
              type="button"
              onClick={() => {
                handleCategoryChange("Ruang");
                setStatusFilter("Semua");
              }}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === "Ruang"
                  ? "border-blue-700 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Ruang
            </button>
            <button
              type="button"
              onClick={() => {
                handleCategoryChange("Peralatan");
                setStatusFilter("Semua");
              }}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === "Peralatan"
                  ? "border-blue-700 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Peralatan
            </button>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("Semua");
                setItemFilter("Semua");
                setStatusFilter("Menunggu");
              }}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === "Menunggu"
                  ? "border-blue-700 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Menunggu Semakan
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 sm:text-sm"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tempahan Baru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Page Intro */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sistem Tempahan Ruang & Peralatan
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Urus permohonan bilik perbincangan, makmal komputer, dan pinjaman
              peralatan studio atau sukan kampus.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tarikh Hari Ini:</span>
            <span className="font-mono font-medium text-slate-800 tabular-nums">
              {formatDisplayDate(todayStr)}
            </span>
          </div>
        </section>

        {/* Summary KPI Cards */}
        <section
          aria-label="Ringkasan tempahan"
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Tempahan Hari Ini
              </span>
              <CalendarDays
                className="h-4 w-4 text-blue-700"
                aria-hidden="true"
              />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {isLoading ? "—" : summary.todayTotal}
              </span>
              <span className="text-xs text-slate-500">rekod aktif</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 tabular-nums">
              {summary.todayRooms} Ruang · {summary.todayEquipment} Peralatan
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Masih Menunggu
              </span>
              <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {isLoading ? "—" : summary.pendingCount}
              </span>
              <span className="text-xs text-slate-500">permohonan</span>
            </div>
            <div className="mt-2">
              {summary.pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter("Menunggu")}
                  className="text-xs font-medium text-amber-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  Tapis permohonan menunggu
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  Semua permohonan telah disemak
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Diluluskan
              </span>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {isLoading ? "—" : summary.approvedCount}
              </span>
              <span className="text-xs text-slate-500">lulus</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sedia untuk kegunaan pemohon
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Jumlah Keseluruhan
              </span>
              <Layers className="h-4 w-4 text-slate-500" aria-hidden="true" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {isLoading ? "—" : summary.totalCount}
              </span>
              <span className="text-xs text-slate-500">jumlah rekod</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 tabular-nums">
              Menunjukkan {filteredBookings.length} daripada{" "}
              {summary.totalCount} rekod
            </p>
          </div>
        </section>

        {/* Main Workspace Table Surface */}
        <section className="rounded-xl border border-slate-200 bg-white">
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search Input */}
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pemohon atau #ID..."
                  aria-label="Cari nama pemohon atau ID tempahan"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* Filter by Item Type (Ruang / Peralatan) */}
              <div>
                <label htmlFor="filter-jenis" className="sr-only">
                  Tapis mengikut jenis item
                </label>
                <select
                  id="filter-jenis"
                  value={categoryFilter}
                  onChange={(e) =>
                    handleCategoryChange(e.target.value as CategoryFilter)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="Semua">Semua Jenis (Ruang & Peralatan)</option>
                  <option value="Ruang">Ruang Sahaja</option>
                  <option value="Peralatan">Peralatan Sahaja</option>
                </select>
              </div>

              {/* Filter by Specific Item */}
              <div>
                <label htmlFor="filter-item" className="sr-only">
                  Tapis mengikut item khusus
                </label>
                <select
                  id="filter-item"
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="Semua">Semua Item Khusus</option>
                  {availableItemOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div>
                <label htmlFor="filter-status" className="sr-only">
                  Tapis mengikut status
                </label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="Semua">Semua Status</option>
                  {BOOKING_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Set Semula</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => loadBookings(false)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>Muat Semula</span>
              </button>
            </div>
          </div>

          {/* Error State */}
          {fetchError ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-slate-900">
                Gagal memuatkan data tempahan
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
                {fetchError}
              </p>
              <button
                type="button"
                onClick={() => loadBookings(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Cuba Semula</span>
              </button>
            </div>
          ) : isLoading ? (
            /* Loading Skeleton State */
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-8 w-36 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            /* Empty State */
            <div className="px-6 py-14 text-center">
              <h2 className="text-sm font-semibold text-slate-900">
                {bookings.length === 0
                  ? "Tiada rekod tempahan buat masa ini"
                  : "Tiada tempahan sepadan dengan penapis anda"}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                {bookings.length === 0
                  ? "Mulakan dengan menambah tempahan bilik perbincangan, makmal komputer, atau peralatan baharu."
                  : "Cuba tukar kata kunci carian atau tetapkan semula pilihan penapis."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {bookings.length === 0 ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Tambah Tempahan Pertama</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Set Semula Penapis</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3 pl-5 pr-3 font-mono">ID</th>
                      <th className="px-3 py-3">Nama Pemohon</th>
                      <th className="px-3 py-3">Item Tempahan</th>
                      <th className="px-3 py-3">Tarikh</th>
                      <th className="px-3 py-3">Slot Masa</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="py-3 pl-3 pr-5 text-right">
                        Tindakan Admin & Rekod
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredBookings.map((row) => {
                      const category = getItemCategory(row.item_tempahan);
                      const isRowUpdating = updatingId === row.id;
                      const isToday = row.tarikh.slice(0, 10) === todayStr;

                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="py-3.5 pl-5 pr-3 font-mono text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
                            #{row.id}
                          </td>
                          <td className="px-3 py-3.5 font-medium text-slate-900">
                            <span className="block max-w-[220px] truncate">
                              {row.nama_pemohon}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 whitespace-nowrap">
                                {row.item_tempahan}
                              </span>
                              <span className="text-xs text-slate-500">
                                {category}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                            <span>{formatDisplayDate(row.tarikh)}</span>
                            {isToday ? (
                              <span className="ml-1.5 font-sans text-xs font-medium text-blue-700">
                                · Hari Ini
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                            {row.slot_masa}
                          </td>
                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* Quick 1-click Lulus */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStatus(row, "Diluluskan")
                                }
                                disabled={
                                  isRowUpdating || row.status === "Diluluskan"
                                }
                                title="Luluskan tempahan serta-merta"
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
                              >
                                <Check
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Lulus</span>
                              </button>

                              {/* Quick 1-click Tolak */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStatus(row, "Ditolak")
                                }
                                disabled={
                                  isRowUpdating || row.status === "Ditolak"
                                }
                                title="Tolak tempahan serta-merta"
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
                              >
                                <X
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Tolak</span>
                              </button>

                              <span
                                aria-hidden="true"
                                className="mx-1 h-4 w-px bg-slate-200"
                              />

                              <button
                                type="button"
                                onClick={() => openEditModal(row)}
                                aria-label={`Kemaskini tempahan #${row.id}`}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
                              >
                                <Pencil
                                  className="h-3.5 w-3.5 text-slate-500"
                                  aria-hidden="true"
                                />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                aria-label={`Padam tempahan #${row.id}`}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 whitespace-nowrap shrink-0"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Padam</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked List View */}
              <div className="divide-y divide-slate-200 md:hidden">
                {filteredBookings.map((row) => {
                  const category = getItemCategory(row.item_tempahan);
                  const isRowUpdating = updatingId === row.id;
                  const isToday = row.tarikh.slice(0, 10) === todayStr;

                  return (
                    <div key={row.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-medium tabular-nums">
                              #{row.id}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{category}</span>
                            {isToday ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-blue-700">
                                  Hari Ini
                                </span>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                            {row.nama_pemohon}
                          </p>
                          <p className="text-xs font-medium text-slate-700">
                            {row.item_tempahan}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs text-slate-600 tabular-nums">
                        <span>{formatDisplayDate(row.tarikh)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{row.slot_masa}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(row, "Diluluskan")}
                          disabled={
                            isRowUpdating || row.status === "Diluluskan"
                          }
                          className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-45 whitespace-nowrap"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Lulus</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(row, "Ditolak")}
                          disabled={isRowUpdating || row.status === "Ditolak"}
                          className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 disabled:opacity-45 whitespace-nowrap"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Padam</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Create / Edit Modal */}
      <BookingModal
        isOpen={isModalOpen}
        editingRecord={editingRecord}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingRecord(null);
          }
        }}
        onSubmit={handleSaveBooking}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        record={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
