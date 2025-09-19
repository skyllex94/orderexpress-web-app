import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../services/supabase";

type VendorGroup = {
  id: string;
  name: string;
  itemCount: number;
};

export default function OrderingCart({ businessId }: { businessId: string }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState<"none" | "all">("none");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  type UIPackaging = {
    id: string;
    label: string; // e.g., "12 x 750mL (bottles)"
    price: number | null; // package price as stored
  };
  const [products, setProducts] = useState<
    { id: string; name: string; vendor: string; packaging: UIPackaging[] }[]
  >([]);
  const [selectedPkgIdx, setSelectedPkgIdx] = useState<Record<string, number>>(
    {}
  );
  // Load products with their vendor (from earliest packaging row's vendor, else fallback)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!businessId) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        type PackagingRow = {
          id?: string | null;
          vendor_id: string | null;
          created_at: string | null;
          units_per_case: number | null;
          unit_volume: number | null;
          measure_type: string | null;
          unit_type: string | null;
          price: number | null;
          vendors: { name: string | null } | null;
        };
        type ProductRow = {
          id: string;
          name: string | null;
          vendor: string | null; // legacy field
          drink_products_packaging: PackagingRow[] | null;
        };
        const { data, error: err } = await supabase
          .from("drink_products")
          .select(
            "id, name, vendor, drink_products_packaging(id, vendor_id, created_at, units_per_case, unit_volume, measure_type, unit_type, price, vendors(name))"
          )
          .eq("business_id", businessId);
        if (err) throw err;
        const rows = (data || []) as unknown as ProductRow[];
        const mapped = rows.flatMap((r) => {
          const pkgs: PackagingRow[] = Array.isArray(r.drink_products_packaging)
            ? (r.drink_products_packaging as PackagingRow[])
            : [];
          const vendorToPkgs = new Map<string, PackagingRow[]>();
          for (const p of pkgs) {
            const nmRaw = (p?.vendors?.name || r.vendor || "").trim();
            const nm = nmRaw.length > 0 ? nmRaw : "Other";
            const arr = vendorToPkgs.get(nm) || [];
            arr.push(p);
            vendorToPkgs.set(nm, arr);
          }
          if (vendorToPkgs.size === 0) {
            // No packaging rows with vendor; make a single entry under fallback vendor
            const fallback = (r.vendor || "Other").trim() || "Other";
            vendorToPkgs.set(fallback, []);
          }
          const entries: {
            id: string;
            name: string;
            vendor: string;
            packaging: UIPackaging[];
          }[] = [];
          vendorToPkgs.forEach((pkgRows, vendorName) => {
            const uiPackaging: UIPackaging[] = pkgRows.map((p, idx) => {
              const units =
                p.units_per_case != null ? Number(p.units_per_case) : null;
              const volume = p.unit_volume != null ? String(p.unit_volume) : "";
              const measure = (p.measure_type || "").trim();
              const unit = (p.unit_type || "").trim();
              const unitPlural = (() => {
                const map: Record<string, string> = {
                  bottle: "bottles",
                  can: "cans",
                  "can(food)": "cans",
                  keg: "kegs",
                  bag: "bags",
                  box: "boxes",
                  carton: "cartons",
                  container: "containers",
                  package: "packages",
                  other: "units",
                };
                return map[unit] || (unit ? `${unit}s` : "units");
              })();
              const sizePart = volume && measure ? `${volume}${measure}` : "";
              const label =
                units && units > 0
                  ? `${units} x ${sizePart} (${unitPlural})`
                  : `${sizePart} (${unit})`;
              return {
                id: String(p.id || `${r.id}_pkg_${idx}`),
                label,
                price: p.price != null ? Number(p.price) : null,
              };
            });
            const vendorSlug =
              vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "other";
            entries.push({
              id: `${r.id}__${vendorSlug}`,
              name: r.name || "Untitled",
              vendor: vendorName,
              packaging: uiPackaging,
            });
          });
          return entries;
        });
        if (!mounted) return;
        setProducts(mapped);
        // Initialize default packaging selections (first option)
        setSelectedPkgIdx((prev) => {
          const next: Record<string, number> = { ...prev };
          for (const p of mapped) {
            if (next[p.id] == null) next[p.id] = 0;
          }
          return next;
        });
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Failed to load products";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  // Build vendor groups from products list
  // Full vendor list (unused after filtering) removed

  // Filter products first (by product name OR vendor), then rebuild vendor groups
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.vendor || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const filteredVendors: VendorGroup[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of filteredProducts) {
      const key = p.vendor || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const arr = Array.from(counts.entries()).map(([name, count]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "other",
      name,
      itemCount: count,
    }));
    arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filteredProducts]);

  // Auto-expand all vendors while searching for quicker scanning
  useEffect(() => {
    const q = search.trim();
    if (q.length > 0) {
      setExpanded(Object.fromEntries(filteredVendors.map((v) => [v.id, true])));
    }
  }, [search, filteredVendors]);

  function toggleRow(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function onExpandAll() {
    const next = expandAll === "all" ? "none" : "all";
    setExpandAll(next);
    if (next === "all") {
      setExpanded(Object.fromEntries(filteredVendors.map((v) => [v.id, true])));
    } else {
      setExpanded({});
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        {/* Top controls */}
        <div className="px-6 pt-6">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-[560px]">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                className="w-full rounded-md bg-gray-50 border border-transparent pl-9 pr-3 py-2 text-sm placeholder:text-gray-500 text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="Search by brand, name, etc …"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Stepper */}
            <div className="flex items-center gap-3 text-sm text-gray-600 mx-auto sm:mx-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400 inline-block" />
                <span className="font-medium text-[var(--oe-black)]">
                  Cart Builder
                </span>
              </div>
              <span className="w-16 border-t border-dashed border-gray-300" />
              <div>Your Cart</div>
              <span className="w-16 border-t border-dashed border-gray-300" />
              <div>Cart Review</div>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md bg-white ring-1 ring-gray-200 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-gray-50"
            >
              Group by Vendor
              <svg
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md bg-white ring-1 ring-gray-200 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-gray-50"
            >
              Latest Finalized
              <svg
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md bg-white ring-1 ring-gray-200 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-gray-50"
            >
              Par Levels
              <svg
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div className="ml-auto" />
            <button
              type="button"
              onClick={onExpandAll}
              className="ml-auto inline-flex items-center gap-2 rounded-md bg-white ring-1 ring-gray-200 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-gray-50"
            >
              Expand All
              <svg
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* List header */}
        <div className="mt-5 border-t border-gray-100">
          <div className="grid grid-cols-12 text-xs text-gray-600 px-6 py-2">
            <div className="col-span-5 flex items-center gap-1">
              <span>Item</span>
              <svg
                className="h-3 w-3 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <div className="col-span-2">Packaging</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Inventory</div>
            <div className="col-span-1">Par</div>
            <div className="col-span-1 text-right">Cart Qty</div>
          </div>
        </div>

        {/* Vendor groups */}
        <div className="divide-y divide-gray-100">
          {loading && (
            <div className="px-6 py-10 text-sm text-gray-500">Loading…</div>
          )}
          {filteredVendors.map((v) => {
            const isOpen = expanded[v.id] === true;
            return (
              <div key={v.id} className="px-6">
                <div className="grid grid-cols-12 py-3 items-center">
                  <div className="col-span-5">
                    <button
                      type="button"
                      className="text-[var(--oe-black)] font-medium hover:underline"
                      onClick={() => toggleRow(v.id)}
                    >
                      {v.name}
                      <span className="ml-2 text-xs text-gray-500">
                        {v.itemCount} items
                      </span>
                    </button>
                  </div>
                  <div className="col-span-6 text-sm text-gray-500">
                    {/* empty grid cells for header alignment */}
                  </div>
                  <div className="col-span-1 ml-auto text-right">
                    <button
                      type="button"
                      onClick={() => toggleRow(v.id)}
                      className="text-xs text-gray-600 hover:text-[var(--oe-black)] inline-flex items-center gap-1"
                    >
                      {isOpen ? "Collapse" : "Expand"}
                      <svg
                        className={`h-3 w-3 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="pb-4 pt-1">
                    {filteredProducts
                      .filter((p) => p.vendor === v.name)
                      .map((p) => {
                        const pkgIdx = selectedPkgIdx[p.id] ?? 0;
                        const pkg = p.packaging[pkgIdx];
                        const priceDisplay =
                          pkg?.price != null
                            ? `$${Number(pkg.price).toFixed(2)}`
                            : "-";
                        return (
                          <div
                            key={p.id}
                            className="grid grid-cols-12 items-center gap-3 rounded-lg ring-1 ring-gray-200 bg-white px-3 py-3 mb-2 shadow-sm"
                          >
                            <div className="col-span-5">
                              <div className="text-sm font-medium text-[var(--oe-black)]">
                                {p.name}
                              </div>
                              {p.packaging.length === 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  No packaging configured
                                </div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <select
                                className="w-full rounded-md bg-gray-50 border border-transparent px-2 py-1.5 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                                value={pkg?.id || ""}
                                onChange={(e) => {
                                  const idx = p.packaging.findIndex(
                                    (x) => x.id === e.target.value
                                  );
                                  setSelectedPkgIdx((prev) => ({
                                    ...prev,
                                    [p.id]: idx >= 0 ? idx : 0,
                                  }));
                                }}
                                disabled={p.packaging.length === 0}
                              >
                                {p.packaging.length === 0 ? (
                                  <option value="">No options</option>
                                ) : (
                                  p.packaging.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.label}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                            <div className="col-span-2 text-sm text-[var(--oe-black)]">
                              {priceDisplay}
                            </div>
                            <div className="col-span-1 text-sm text-gray-500">
                              -
                            </div>
                            <div className="col-span-1 text-sm text-gray-500">
                              -
                            </div>
                            <div className="col-span-1 text-right">
                              <input
                                className="w-20 rounded-md bg-gray-50 border border-transparent px-2 py-1.5 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none text-right"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        );
                      }) || null}
                    {products.filter((p) => p.vendor === v.name).length ===
                      0 && (
                      <div className="text-xs text-gray-500 px-3 py-2">
                        No items.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
