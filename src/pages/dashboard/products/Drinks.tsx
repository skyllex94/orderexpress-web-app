import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../services/supabase";

type UIProductRow = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  vendor: string;
  sku?: string;
  price: string; // display-ready, e.g., "$24.00 / 12 x 750mL (bottles)"
  notes?: string;
};

export default function ProductsDrinks({
  businessId,
  onOpenProduct,
  refreshKey,
  searchQuery,
}: {
  businessId: string;
  onOpenProduct: (id: string) => void;
  refreshKey?: number;
  searchQuery?: string;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<UIProductRow[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const total = rows.length;
  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === total;
  const someSelected = selectedCount > 0 && selectedCount < total;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected, selectedCount]);

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
        // Fetch products plus packaging vendors and pricing; dedupe vendors per product
        type PackagingRow = {
          units_per_case: number | null;
          unit_volume: number | null;
          measure_type: string | null;
          unit_type: string | null;
          price: number | null;
          created_at: string | null;
          vendors: { name: string | null } | null;
        };
        type ProductRow = {
          id: string;
          name: string | null;
          category: string | null;
          subcategory: string | null;
          sku: string | null;
          notes: string | null;
          drink_products_packaging: PackagingRow[] | null;
        };
        const { data, error: err } = await supabase
          .from("drink_products")
          .select(
            "id, name, category, subcategory, sku, notes, drink_products_packaging(units_per_case, unit_volume, measure_type, unit_type, price, created_at, vendors(name))"
          )
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (!mounted) return;
        const rowsData: ProductRow[] = (data || []) as unknown as ProductRow[];
        const mapped: UIProductRow[] = rowsData.map((r) => {
          // Vendors list from packaging
          const vendorNames = new Set<string>();
          const pkgs: PackagingRow[] = Array.isArray(r.drink_products_packaging)
            ? (r.drink_products_packaging as PackagingRow[])
            : [];
          for (const p of pkgs) {
            const nm = p?.vendors?.name || null;
            if (nm && nm.trim().length > 0) vendorNames.add(nm.trim());
          }
          const vendorList = Array.from(vendorNames).join(", ") || "-";
          // Compute price display from first packaging (by created_at asc if available)
          let priceDisplay = "-";
          if (pkgs.length > 0) {
            const sorted = [...pkgs].sort((a, b) => {
              const aa = a.created_at || "";
              const bb = b.created_at || "";
              return aa < bb ? -1 : aa > bb ? 1 : 0;
            });
            const first = sorted[0];
            if (first && first.price != null) {
              const rawPrice: unknown = first.price as unknown;
              const priceNum =
                typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
              if (!Number.isFinite(priceNum)) {
                // leave as '-'
              } else {
                const units =
                  first.units_per_case != null
                    ? Number(first.units_per_case)
                    : null;
                const perUnit =
                  units && Number.isFinite(units) && units > 0
                    ? priceNum / units
                    : priceNum;
                const perVal = perUnit.toFixed(2);
                const unit = (first.unit_type || "").trim();
                const unitLabel = unit || "unit";
                const unitSz =
                  first.unit_volume != null ? String(first.unit_volume) : "";
                const measure = (first.measure_type || "").trim();
                const hasSize = unitSz.length > 0 && measure.length > 0;
                const sizePart = hasSize ? ` (${unitSz}${measure})` : "";
                priceDisplay = `$${perVal}/${unitLabel}${sizePart}`;
              }
            }
          }
          return {
            id: r.id,
            name: r.name || "Untitled",
            category: r.category || "-",
            subcategory: r.subcategory || undefined,
            vendor: vendorList,
            sku: r.sku || "",
            price: priceDisplay,
            notes: r.notes || undefined,
          };
        });
        setProducts(mapped);
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Failed to load products";
        if (!mounted) return;
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    setSelectedIds(new Set());
    return () => {
      mounted = false;
    };
  }, [businessId, refreshKey]);

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === total) return new Set();
      return new Set(rows.map((p) => p.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="px-6 pt-6">
          <h2 className="font-medium text-[var(--oe-black)]">Drink Products</h2>
          <p className="mt-1 text-sm text-gray-600">Manage drink items.</p>
        </div>

        {selectedCount > 0 && (
          <div className="mx-6 mt-4 mb-0 rounded-md bg-black/5 text-[var(--oe-black)] px-3 py-2 text-sm flex items-center justify-between">
            <span>{selectedCount} selected</span>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-md bg-white hover:bg-gray-50 ring-1 ring-gray-200"
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100 text-left text-xs text-gray-600">
                <th className="w-10 px-3 sm:px-6 py-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-2 sm:px-3 py-3 font-medium min-w-[120px]">
                  Product
                </th>
                <th className="px-2 sm:px-3 py-3 font-medium min-w-[100px] hidden sm:table-cell">
                  Category
                </th>
                <th className="px-2 sm:px-3 py-3 font-medium min-w-[100px] hidden md:table-cell">
                  Vendor
                </th>
                <th className="px-2 sm:px-3 py-3 font-medium min-w-[120px] hidden lg:table-cell">
                  SKU
                </th>
                <th className="px-3 sm:px-6 py-3 font-medium text-right min-w-[120px]">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-gray-500">
                    Loading products…
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-gray-500">
                    No products yet.
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.length > 0 &&
                rows.map((p, idx) => {
                  const checked = selectedIds.has(p.id);
                  const isLast = idx === rows.length - 1;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 sm:px-6 py-3 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={checked}
                          onChange={() => toggleRow(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-[var(--oe-black)] hover:underline"
                            onClick={() => onOpenProduct(p.id)}
                          >
                            {p.name}
                          </button>
                          {p.notes && (
                            <div className="relative group">
                              <svg
                                className="h-4 w-4 text-gray-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="4"
                                  y="3"
                                  width="16"
                                  height="18"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M8 7h8" />
                                <path d="M8 11h8" />
                                <path d="M8 15h5" />
                              </svg>
                              <div
                                className={`pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-pre-wrap rounded-md bg-white px-3 py-2 text-sm text-[var(--oe-black)] ring-1 ring-gray-200 shadow-md group-hover:block min-w-[160px] max-w-[320px] ${
                                  isLast
                                    ? "bottom-full -translate-y-2"
                                    : "top-full translate-y-2"
                                }`}
                              >
                                {p.notes}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="sm:hidden mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
                          <div className="font-medium">Category:</div>
                          <div>
                            <div>{p.category}</div>
                            {p.subcategory ? (
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {p.subcategory}
                              </div>
                            ) : null}
                          </div>
                          <div className="font-medium">Vendor:</div>
                          <div>{p.vendor}</div>
                          <div className="font-medium">SKU:</div>
                          <div>{p.sku || ""}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden sm:table-cell">
                        <div className="text-sm text-gray-700">
                          {p.category}
                        </div>
                        {p.subcategory ? (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {p.subcategory}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden md:table-cell">
                        <div className="text-sm text-gray-700">{p.vendor}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden lg:table-cell">
                        <div className="text-sm text-gray-700">
                          {p.sku || ""}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 align-middle text-right">
                        <div className="text-sm text-gray-900">{p.price}</div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
