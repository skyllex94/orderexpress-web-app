import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabase";

type Vendor = {
  id: string;
  business_id: string;
  name: string;
  notes: string | null;
  account_number: string | null;
  office_phone: string | null;
  website: string | null;
  delivery_days: string | null; // CSV or JSON string
  case_min: number | null;
  dollar_min: number | null;
};

export default function OrderingVendors() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      let businessId: string | null = null;
      try {
        businessId = localStorage.getItem("oe_current_business_id");
      } catch {
        businessId = null;
      }
      if (!businessId) {
        setVendors([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("vendors")
        .select(
          "id, business_id, name, notes, account_number, office_phone, website, delivery_days, case_min, dollar_min"
        )
        .eq("business_id", businessId)
        .order("name", { ascending: true });
      if (!mounted) return;
      if (err) {
        setError(err.message || "Failed to load vendors");
        setVendors([]);
      } else {
        const list = ((data as Vendor[]) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setVendors(list);
        setSelectedIndex(0);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedVendor: Vendor | null =
    vendors && vendors.length > 0 && selectedIndex >= 0
      ? vendors[Math.min(selectedIndex, vendors.length - 1)]
      : null;

  const deliveryDaysFromVendor = (() => {
    if (!selectedVendor?.delivery_days) return new Set<string>();
    const raw = selectedVendor.delivery_days.trim();
    let parts: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parts = parsed.map((x) => String(x));
      }
    } catch {
      parts = raw.split(/[,\s]+/);
    }
    const norm = parts
      .map((p) => p.toString().trim().toLowerCase())
      .filter(Boolean)
      .map((p) =>
        p.startsWith("sun")
          ? "Sunday"
          : p.startsWith("mon")
          ? "Monday"
          : p.startsWith("tue")
          ? "Tuesday"
          : p.startsWith("wed")
          ? "Wednesday"
          : p.startsWith("thu")
          ? "Thursday"
          : p.startsWith("fri")
          ? "Friday"
          : p.startsWith("sat")
          ? "Saturday"
          : ""
      )
      .filter(Boolean);
    return new Set<string>(norm);
  })();

  type RepForm = {
    id: string;
    name: string;
    email: string;
    phone: string;
    sendEmail: boolean;
    attachCsv: boolean;
    sendText: boolean;
  };

  const createEmptyRep = (): RepForm => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    email: "",
    phone: "",
    sendEmail: false,
    attachCsv: false,
    sendText: false,
  });

  const [reps, setReps] = useState<RepForm[]>([]);
  const [repsLoading, setRepsLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function loadReps() {
      if (!selectedVendor?.id) {
        if (mounted) setReps([]);
        return;
      }
      setRepsLoading(true);
      const { data, error: err } = await supabase
        .from("vendors_reps")
        .select("id, name, email, phone")
        .eq("vendor_id", selectedVendor.id)
        .order("name", { ascending: true });
      if (!mounted) return;
      if (err) {
        // On error, just show empty and allow adding manually
        setReps([]);
      } else {
        const mapped: RepForm[] = (data || []).map((r: any) => ({
          id: r.id as string,
          name: (r.name as string) || "",
          email: (r.email as string) || "",
          phone: (r.phone as string) || "",
          sendEmail: false,
          attachCsv: false,
          sendText: false,
        }));
        setReps(mapped);
      }
      setRepsLoading(false);
    }
    loadReps();
    return () => {
      mounted = false;
    };
  }, [selectedVendor?.id]);

  function updateRep<K extends keyof RepForm>(
    id: string,
    key: K,
    value: RepForm[K]
  ) {
    setReps((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  }

  function removeRep(id: string) {
    setReps((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Vendor list (1/4 width) */}
      <aside className="col-span-12 md:col-span-3">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[var(--oe-black)]">
              My Vendors
            </h3>
            <p className="text-xs text-gray-600">
              Select a vendor to view details
            </p>
          </div>
          <div className="p-2 space-y-1">
            {loading && (
              <div className="px-3 py-8 text-sm text-gray-500">
                Loading vendors…
              </div>
            )}
            {!loading && error && (
              <div className="px-3 py-3 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && vendors && vendors.length === 0 && (
              <div className="px-3 py-8 text-sm text-gray-500">
                No vendors yet.
              </div>
            )}
            {!loading && !error && vendors && vendors.length > 0 && (
              <div className="space-y-1">
                {vendors.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition ${
                      idx === selectedIndex
                        ? "bg-[var(--oe-green)]/10 text-[var(--oe-black)] ring-1 ring-[var(--oe-green)]/30"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right: Vendor form (3/4 width) */}
      <section className="col-span-12 md:col-span-9">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--oe-black)] truncate">
                {selectedVendor?.name || "No vendor selected"}
              </h3>
            </div>
            <button
              type="button"
              className="rounded-md bg-[var(--oe-green)] px-3 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              SAVE
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {/* Top: Two columns - Left details, Right address */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left column */}
              <div className="col-span-12 md:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Account Number
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                    value={selectedVendor?.account_number || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Office Phone
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                    value={selectedVendor?.office_phone || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Website
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="https://"
                    value={selectedVendor?.website || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Internal Accounting ID
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                    value={selectedVendor?.notes || ""}
                    readOnly
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-12 md:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Address
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="Address Line 1"
                    readOnly
                  />
                </div>
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="Address Line 2"
                  readOnly
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="City"
                  readOnly
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="State/Province/Region"
                  readOnly
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="Zip/Postal Code"
                  readOnly
                />
              </div>
            </div>

            {/* Reps group */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-[var(--oe-black)]">
                Reps
              </div>

              <div className="space-y-3">
                {repsLoading && (
                  <div className="text-sm text-gray-500">Loading reps…</div>
                )}
                {!repsLoading && reps.length === 0 && (
                  <div className="text-sm text-gray-500">No reps yet.</div>
                )}
                {!repsLoading &&
                  reps.length > 0 &&
                  reps.map((rep, idx) => (
                    <div
                      key={rep.id}
                      className="rounded-xl ring-1 ring-gray-200 p-4"
                    >
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-4">
                          <label className="block text-xs font-medium text-gray-600">
                            Rep Name{" "}
                            <span className="text-red-500">Required</span>
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                            placeholder=""
                            value={rep.name}
                            onChange={(e) =>
                              updateRep(rep.id, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-12 md:col-span-5">
                          <label className="block text-xs font-medium text-gray-600">
                            Email <span className="text-red-500">Required</span>
                          </label>
                          <input
                            type="email"
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                            placeholder="name@example.com"
                            value={rep.email}
                            onChange={(e) =>
                              updateRep(rep.id, "email", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <label className="block text-xs font-medium text-gray-600">
                            Cell Phone
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                            placeholder=""
                            value={rep.phone}
                            onChange={(e) =>
                              updateRep(rep.id, "phone", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-6">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={rep.sendEmail}
                            onChange={(e) =>
                              updateRep(rep.id, "sendEmail", e.target.checked)
                            }
                          />
                          <span>Send orders via email</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={rep.attachCsv}
                            onChange={(e) =>
                              updateRep(rep.id, "attachCsv", e.target.checked)
                            }
                          />
                          <span>Attach order CSV to email</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={rep.sendText}
                            onChange={(e) =>
                              updateRep(rep.id, "sendText", e.target.checked)
                            }
                          />
                          <span>Send orders via text</span>
                        </label>

                        {reps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRep(rep.id)}
                            className="ml-auto text-sm text-red-600 hover:underline"
                          >
                            Delete rep
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setReps((prev) => [...prev, createEmptyRep()])}
                  className="inline-flex items-center gap-2 text-sm rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>Add new rep</span>
                </button>
              </div>
            </div>

            {/* Delivery days + minimums */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm font-medium text-[var(--oe-black)]">
                    Delivery days
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((d) => (
                      <label
                        key={d}
                        className="inline-flex items-center gap-2 text-gray-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={deliveryDaysFromVendor.has(d)}
                          readOnly
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Case minimum
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="0"
                    value={selectedVendor?.case_min ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Dollar minimum
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent pl-7 px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                      placeholder="0"
                      value={selectedVendor?.dollar_min ?? ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
