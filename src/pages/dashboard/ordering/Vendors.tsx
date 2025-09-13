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
        setVendors((data as Vendor[]) || []);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

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
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition ${
                      idx === 0
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
                L knife
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Office Phone
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Website
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Internal Accounting ID
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
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
                  />
                </div>
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="Address Line 2"
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="City"
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="State/Province/Region"
                />
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="Zip/Postal Code"
                />
              </div>
            </div>

            {/* Rep section */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600">
                    Rep Name <span className="text-red-500">Required</span>
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
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
                  />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600">
                    Cell Phone
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 md:col-span-6 flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>Send orders via email</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>Attach order CSV to email</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>Send orders via text</span>
                  </label>
                </div>
                <div className="col-span-12 md:col-span-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete rep
                  </button>
                  <button
                    type="button"
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
