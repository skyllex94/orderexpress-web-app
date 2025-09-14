import { useEffect, useMemo, useRef, useState } from "react";

type UIProductRow = {
  id: string;
  name: string;
  category: string;
  vendor: string;
  measuringUnit: string; // e.g., "750 mL bottle"
  cost: string; // display-ready, e.g., "$24.00"
};

export default function ProductsDrinks() {
  const [loading] = useState<boolean>(false);
  // Placeholder data for UI only
  const [products] = useState<UIProductRow[]>([
    {
      id: "p1",
      name: "Reposado Tequila",
      category: "Spirits / Tequila",
      vendor: "Agave Imports",
      measuringUnit: "750 mL bottle",
      cost: "$28.00",
    },
    {
      id: "p2",
      name: "Craft IPA",
      category: "Beer / IPA",
      vendor: "Hop Valley",
      measuringUnit: "12 fl.oz can",
      cost: "$1.85",
    },
    {
      id: "p3",
      name: "House Cabernet",
      category: "Wine / Red",
      vendor: "Vintner Co.",
      measuringUnit: "750 mL bottle",
      cost: "$12.40",
    },
  ]);

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
                <th className="w-10 px-6 py-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-3 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Vendor</th>
                <th className="px-3 py-3 font-medium">Measuring Unit</th>
                <th className="px-6 py-3 font-medium text-right">Cost</th>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-gray-500">
                    No products yet.
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
                      <td className="px-6 py-3 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={checked}
                          onChange={() => toggleRow(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="text-sm font-medium text-[var(--oe-black)]">
                          {p.name}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="text-sm text-gray-700">
                          {p.category}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="text-sm text-gray-700">{p.vendor}</div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="text-sm text-gray-700">
                          {p.measuringUnit}
                        </div>
                      </td>
                      <td className="px-6 py-3 align-middle text-right">
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
