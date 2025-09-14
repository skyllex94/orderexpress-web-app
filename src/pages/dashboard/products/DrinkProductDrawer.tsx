import { useEffect, useRef, useState } from "react";

type DrinkProductDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function DrinkProductDrawer({
  open,
  onClose,
}: DrinkProductDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [unitSize, setUnitSize] = useState("");
  const [unitType, setUnitType] = useState("");
  const [cost, setCost] = useState("");

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
      setBrand("");
      setCategory("");
      setVendor("");
      setUnitSize("");
      setUnitType("");
      setCost("");
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
        className={`fixed inset-y-0 right-0 z-50 w-[28rem] max-w-[92vw] bg-white shadow-2xl ring-1 ring-gray-200 transform transition-transform duration-500 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
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

        <div className="p-5 space-y-5 overflow-y-auto h-full">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Product Name
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
              placeholder="e.g., Reposado Tequila"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Brand Name
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
              placeholder="e.g., Casa Azul"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Category
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
              placeholder="e.g., Spirits / Tequila"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
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
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Unit Size
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., 750 mL"
                value={unitSize}
                onChange={(e) => setUnitSize(e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700">
                Unit Type
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="e.g., bottle, can, keg"
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Cost
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
              placeholder="$0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
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
            className="inline-flex items-center gap-2 rounded-md bg-[var(--oe-green)] px-3 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--oe-green)]/60"
            onClick={onClose}
          >
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
          </button>
        </div>
      </div>
    </>
  );
}
