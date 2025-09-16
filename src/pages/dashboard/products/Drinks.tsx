import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../services/supabase";

type UIProductRow = {
  id: string;
  name: string;
  category: string;
  vendor: string;
  measuringUnit: string; // e.g., "750 mL bottle"
  cost: string; // display-ready, e.g., "$24.00"
};

export default function ProductsDrinks() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<UIProductRow[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const total = products.length;
  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === total;
  const someSelected = selectedCount > 0 && selectedCount < total;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected, selectedCount]);

  const rows = useMemo(() => products, [products]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch from drink_products; adapt to display columns
        const { data, error: err } = await supabase
          .from("drink_products")
          .select("id, name, category, vendor")
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (!mounted) return;
        const mapped: UIProductRow[] = (data || []).map((r) => ({
          id: r.id as string,
          name: (r.name as string) || "Untitled",
          category: (r.category as string) || "-",
          vendor: (r.vendor as string) || "-",
          measuringUnit: "-",
          cost: "-",
        }));
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
    return () => {
      mounted = false;
    };
  }, []);

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
      return new Set(products.map((p) => p.id));
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
          <p className="text-sm text-gray-600">Manage drink items.</p>
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
                  Measuring Unit
                </th>
                <th className="px-3 sm:px-6 py-3 font-medium text-right min-w-[80px]">
                  Cost
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
                rows.map((p) => {
                  const checked = selectedIds.has(p.id);
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
                        <div className="text-sm font-medium text-[var(--oe-black)]">
                          {p.name}
                        </div>
                        <div className="sm:hidden mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
                          <div className="font-medium">Category:</div>
                          <div>{p.category}</div>
                          <div className="font-medium">Vendor:</div>
                          <div>{p.vendor}</div>
                          <div className="font-medium">Measuring Unit:</div>
                          <div>{p.measuringUnit}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden sm:table-cell">
                        <div className="text-sm text-gray-700">
                          {p.category}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden md:table-cell">
                        <div className="text-sm text-gray-700">{p.vendor}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 align-middle hidden lg:table-cell">
                        <div className="text-sm text-gray-700">
                          {p.measuringUnit}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 align-middle text-right">
                        <div className="text-sm text-gray-900">{p.cost}</div>
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
