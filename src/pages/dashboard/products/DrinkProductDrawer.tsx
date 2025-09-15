import { useEffect, useRef, useState } from "react";
import ConfirmModal from "../../../components/ConfirmModal";
import { supabase } from "../../../services/supabase";

type DrinkProductDrawerProps = {
  open: boolean;
  onClose: () => void;
  businessId: string;
};

export default function DrinkProductDrawer({
  open,
  onClose,
  businessId,
}: DrinkProductDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  // Packaging form state
  type PackagingForm = {
    id: string;
    caseSize: string;
    unitSize: string;
    measureType: string;
    unitType: string;
  };
  const measureOptions = [
    "L",
    "mL",
    "cL",
    "gal",
    "qt",
    "pt",
    "fl.oz",
    "bsp",
    "unit",
    "g",
    "kg",
    "lbs",
    "oz",
  ];
  const unitTypeOptions = [
    "bottle",
    "can",
    "keg",
    "bag",
    "box",
    "can(food)",
    "carton",
    "container",
    "package",
    "other",
  ];
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [reportingCost, setReportingCost] = useState("");
  const [reportingUnit, setReportingUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [packaging, setPackaging] = useState<PackagingForm[]>([
    {
      id: `pkg_${Date.now()}`,
      caseSize: "",
      unitSize: "",
      measureType: "",
      unitType: "",
    },
  ]);
  const [pkgConfirmOpen, setPkgConfirmOpen] = useState<boolean>(false);
  const [pkgToDelete, setPkgToDelete] = useState<string | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      // Reset form when closing (UI-only for now)
      setName("");
      setSku("");
      setCategory("");
      setSubcategory("");
      setVendor("");
      setPrice("");
      setReportingCost("");
      setReportingUnit("");
      setNotes("");
      setPackaging([
        {
          id: `pkg_${Date.now()}`,
          caseSize: "",
          unitSize: "",
          measureType: "",
          unitType: "",
        },
      ]);
    }
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-black/40`}
        aria-hidden={!open}
      />

      {/* Right-side Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[40rem] max-w-[96vw] bg-white shadow-2xl ring-1 ring-gray-200 transform transition-transform duration-500 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        } flex h-full flex-col`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-[var(--oe-black)]">
              Add Drink Product
            </h3>
            <p className="text-xs text-gray-600">
              Enter details for a new item.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md bg-red-50 hover:bg-red-100 text-red-600"
            style={{
              height: 36,
              width: 36,
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">
          {saveError && (
            <div className="rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
              {saveError}
            </div>
          )}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Product Name
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., Reposado Tequila"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {/* Category under Product Name */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700">
                  Category
                </label>
                <input
                  className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="e.g., Spirits"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                SKU
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., 123-ABC"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              {/* Subcategory under SKU */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700">
                  Subcategory
                </label>
                <input
                  className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="e.g., Tequila"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Packaging items */}
          <div className="space-y-4">
            {packaging.map((pkg) => (
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
                    onClick={() => {
                      setPkgToDelete(pkg.id);
                      setPkgConfirmOpen(true);
                    }}
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
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700">
                      Case size
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                      placeholder="e.g., 12"
                      value={pkg.caseSize}
                      onChange={(e) =>
                        setPackaging((prev) =>
                          prev.map((p) =>
                            p.id === pkg.id
                              ? { ...p, caseSize: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700">
                      Unit size
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                      placeholder="e.g., 750"
                      value={pkg.unitSize}
                      onChange={(e) =>
                        setPackaging((prev) =>
                          prev.map((p) =>
                            p.id === pkg.id
                              ? { ...p, unitSize: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700">
                      Measure
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
                            p.id === pkg.id
                              ? { ...p, unitType: e.target.value }
                              : p
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
                      id: `pkg_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2)}`,
                      caseSize: "",
                      unitSize: "",
                      measureType: "",
                      unitType: "",
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
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Price
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="$0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Vendor
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., Agave Imports"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4">
            <h4 className="text-sm font-semibold text-[var(--oe-black)]">
              Reporting
            </h4>
            <div className="mt-3 grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700">
                  Cost
                </label>
                <input
                  className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="$0.00"
                  value={reportingCost}
                  onChange={(e) => setReportingCost(e.target.value)}
                />
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700">
                  Reporting Unit
                </label>
                <input
                  className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                  placeholder="e.g., oz, unit, bottle"
                  value={reportingUnit}
                  onChange={(e) => setReportingUnit(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Notes
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--oe-green)]/60 ${
              saving || !name.trim() || !businessId
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-[var(--oe-green)] text-black hover:opacity-90"
            }`}
            disabled={saving || !name.trim() || !businessId}
            onClick={async () => {
              if (!name.trim()) {
                setSaveError("Product name is required");
                return;
              }
              if (!businessId) {
                setSaveError("Missing business context.");
                return;
              }
              setSaveError(null);
              setSaving(true);
              try {
                const row = {
                  business_id: businessId,
                  name: name.trim(),
                  brand_name: null as string | null,
                  category: category.trim() || null,
                  subcategory: subcategory.trim() || null,
                  vendor: vendor.trim() || null,
                  sku: sku.trim() || null,
                  notes: notes.trim() || null,
                };
                const { error } = await supabase
                  .from("drink_products")
                  .insert([row]);
                if (error) {
                  setSaveError(error.message || "Failed to save product.");
                } else {
                  onClose();
                }
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? (
              <>Saving…</>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={pkgConfirmOpen}
        title="Delete packaging?"
        message="This packaging row will be removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (pkgToDelete) {
            setPackaging((prev) => prev.filter((p) => p.id !== pkgToDelete));
          }
          setPkgToDelete(null);
          setPkgConfirmOpen(false);
        }}
        onClose={() => {
          setPkgToDelete(null);
          setPkgConfirmOpen(false);
        }}
      />
    </>
  );
}
