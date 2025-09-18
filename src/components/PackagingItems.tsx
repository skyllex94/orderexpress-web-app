import React from "react";

export type PackagingRow = {
  id: string;
  caseSize: string;
  unitSize: string;
  measureType: string;
  unitType: string;
  price?: string;
  vendorId?: string;
};

type VendorChoice = { id: string; name: string };

type PackagingItemsProps = {
  packaging: PackagingRow[];
  setPackaging: React.Dispatch<React.SetStateAction<PackagingRow[]>>;
  measureOptions: string[];
  unitTypeOptions: string[];
  vendorChoices: VendorChoice[];
  vendorsLoading: boolean;
  onRequestDelete: (rowId: string) => void;
};

export default function PackagingItems({
  packaging,
  setPackaging,
  measureOptions,
  unitTypeOptions,
  vendorChoices,
  vendorsLoading,
  onRequestDelete,
}: PackagingItemsProps) {
  return (
    <div className="space-y-4 mt-4">
      {packaging.map((pkg, idx) => (
        <div
          key={pkg.id}
          className="space-y-3 rounded-xl ring-1 ring-gray-200 p-4 relative"
        >
          {packaging.length > 1 && (
            <button
              type="button"
              aria-label="Delete packaging"
              className="absolute top-2 right-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600"
              style={{
                height: 28,
                width: 28,
                display: "grid",
                placeItems: "center",
              }}
              onClick={() => onRequestDelete(pkg.id)}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Dynamic Package title */}
          <div className="text-sm font-medium text-[var(--oe-black)]">
            {`Package #${idx + 1}: `}
            <span className="font-normal text-gray-700">
              {(() => {
                const vendorName = (() => {
                  const id = (pkg.vendorId || "").trim();
                  const found = vendorChoices.find((v) => v.id === id)?.name;
                  return found || "-";
                })();
                const size = parseInt(pkg.caseSize, 10);
                const unitSz = (pkg.unitSize || "").trim();
                const measure = (pkg.measureType || "").trim();
                const unit = (pkg.unitType || "").trim();
                const hasCase = Number.isFinite(size) && size > 0;
                const hasUnit = unit.length > 0;
                const hasMeasure = measure.length > 0;
                const hasUnitSize = unitSz.length > 0;
                if (hasCase && hasUnitSize && hasMeasure && hasUnit) {
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
                    return map[unit] || `${unit}s`;
                  })();
                  return `${vendorName} / ${size} x ${unitSz}${measure} (${unitPlural})`;
                }
                if (hasUnitSize && hasMeasure && hasUnit) {
                  return `${vendorName} / ${unitSz}${measure}(${unit})`;
                }
                if (hasMeasure) {
                  return `${vendorName} / ${measure}`;
                }
                return `${vendorName}`;
              })()}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700">
                Units per case
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., 12"
                value={pkg.caseSize}
                onChange={(e) =>
                  setPackaging((prev) =>
                    prev.map((p) =>
                      p.id === pkg.id ? { ...p, caseSize: e.target.value } : p
                    )
                  )
                }
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700">
                Unit volume
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., 750"
                value={pkg.unitSize}
                onChange={(e) =>
                  setPackaging((prev) =>
                    prev.map((p) =>
                      p.id === pkg.id ? { ...p, unitSize: e.target.value } : p
                    )
                  )
                }
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700">
                Measure type
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                value={pkg.measureType}
                onChange={(e) =>
                  setPackaging((prev) =>
                    prev.map((p) =>
                      p.id === pkg.id
                        ? { ...p, measureType: e.target.value }
                        : p
                    )
                  )
                }
              >
                <option value="">Select…</option>
                {measureOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700">
                Unit type
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                value={pkg.unitType}
                onChange={(e) =>
                  setPackaging((prev) =>
                    prev.map((p) =>
                      p.id === pkg.id ? { ...p, unitType: e.target.value } : p
                    )
                  )
                }
              >
                <option value="">Select…</option>
                {unitTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <div className="flex items-baseline justify-between">
                <label className="block text-xs font-medium text-gray-700">
                  Price
                </label>
                <span className="text-[11px] text-gray-600">
                  {(() => {
                    const units = parseInt(pkg.caseSize, 10);
                    const priceRaw = (pkg.price || "").trim();
                    const priceParsed = priceRaw
                      ? Number.parseFloat(priceRaw.replace(/[^0-9.]/g, ""))
                      : NaN;
                    if (!Number.isFinite(priceParsed) || !(units > 1))
                      return null;
                    const per = priceParsed / units;
                    const unitLabel = (() => {
                      const u = (pkg.unitType || "").trim();
                      const map: Record<string, string> = {
                        bottle: "bottle",
                        can: "can",
                        "can(food)": "can",
                        keg: "keg",
                        bag: "bag",
                        box: "box",
                        carton: "carton",
                        container: "container",
                        package: "package",
                        other: "unit",
                      };
                      return map[u] || u || "unit";
                    })();
                    return `$${per.toFixed(2)} per ${unitLabel}`;
                  })()}
                </span>
              </div>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  className="w-full rounded-lg bg-gray-50 border border-transparent pl-6 pr-28 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="0.00"
                  value={pkg.price || ""}
                  onChange={(e) =>
                    setPackaging((prev) =>
                      prev.map((p) =>
                        p.id === pkg.id ? { ...p, price: e.target.value } : p
                      )
                    )
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">
                  {(() => {
                    const units = parseInt(pkg.caseSize, 10);
                    const unitSz = (pkg.unitSize || "").trim();
                    const measure = (pkg.measureType || "").trim();
                    const unit = (pkg.unitType || "").trim();
                    const hasCase = Number.isFinite(units) && units > 0;
                    const hasUnit = unit.length > 0;
                    const hasMeasure = measure.length > 0;
                    const hasUnitSize = unitSz.length > 0;
                    if (hasCase && hasUnitSize && hasMeasure && hasUnit) {
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
                        return map[unit] || `${unit}s`;
                      })();
                      return `/ ${units} x ${unitSz}${measure} (${unitPlural})`;
                    }
                    return "";
                  })()}
                </span>
              </div>
            </div>
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Vendor
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                value={pkg.vendorId || ""}
                onChange={(e) =>
                  setPackaging((prev) =>
                    prev.map((p) =>
                      p.id === pkg.id ? { ...p, vendorId: e.target.value } : p
                    )
                  )
                }
                disabled={vendorsLoading}
              >
                <option value="">Select a vendor…</option>
                {vendorChoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Delete button moved to top-right; only shown if more than 1 */}
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={() =>
            setPackaging((prev) => [
              ...prev,
              {
                id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                caseSize: "",
                unitSize: "",
                measureType: "",
                unitType: "",
                price: "",
                vendorId: "",
              },
            ])
          }
          className="inline-flex items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-black/10"
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
          Add packaging
        </button>
      </div>
    </div>
  );
}
