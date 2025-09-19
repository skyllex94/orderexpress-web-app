import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "../../../components/ConfirmModal";
import ManageDrinkCategoriesModal from "../../../components/modals/ManageDrinkCategoriesModal";
import ManageDrinkSubcategoriesModal from "../../../components/modals/ManageDrinkSubcategoriesModal";
import PackagingItems from "../../../components/PackagingItems";
import { supabase } from "../../../services/supabase";
import DrawerActionsBar from "../../../components/DrawerActionsBar";

type DrinkProductDrawerProps = {
  open: boolean;
  onClose: () => void;
  businessId: string;
  productId?: string | null;
  onSaved?: () => void;
};

export default function DrinkProductDrawer({
  open,
  onClose,
  businessId,
  productId,
  onSaved,
}: DrinkProductDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  // Packaging form state
  type PackagingForm = {
    id: string;
    caseSize: string;
    unitSize: string;
    measureType: string;
    unitType: string;
    price?: string;
    vendorId?: string;
  };
  type ReportingRow = {
    id: string;
    unit: string; // e.g., "case (6 x 1L (bottle))" or "bottle (1L)" or "L"
    cost: string; // display/input as string; parse later on save
    isDefault: boolean;
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
  const [vendorsLoading, setVendorsLoading] = useState<boolean>(false);
  const [vendorChoices, setVendorChoices] = useState<
    { id: string; name: string }[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [subcategoriesLoading, setSubcategoriesLoading] =
    useState<boolean>(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [manageSubcategoriesOpen, setManageSubcategoriesOpen] =
    useState<boolean>(false);
  const [reportingRows, setReportingRows] = useState<ReportingRow[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  type OriginalSnapshot = {
    name: string;
    sku: string;
    categoryId: string;
    subcategoryId: string;
    notes: string;
    packaging: Array<{
      caseSize: string;
      unitSize: string;
      measureType: string;
      unitType: string;
      price: string;
      vendorId: string;
    }>;
  };
  const [original, setOriginal] = useState<OriginalSnapshot | null>(null);
  const [packaging, setPackaging] = useState<PackagingForm[]>([
    {
      id: `pkg_${Date.now()}`,
      caseSize: "",
      unitSize: "750",
      measureType: "mL",
      unitType: "bottle",
      price: "",
      vendorId: "",
    },
  ]);
  const [pkgConfirmOpen, setPkgConfirmOpen] = useState<boolean>(false);
  const [pkgToDelete, setPkgToDelete] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] =
    useState<boolean>(false);
  // Build reporting unit options based on packaging
  const reportingUnitOptions = useMemo(() => {
    const options = new Set<string>();
    for (const p of packaging) {
      const caseSize = parseInt(p.caseSize, 10);
      const unitSize = p.unitSize.trim();
      const measure = p.measureType.trim();
      const unit = p.unitType.trim();
      const hasCase = Number.isFinite(caseSize) && caseSize > 0;
      const hasUnit = unit.length > 0;
      const hasMeasure = measure.length > 0;
      const hasUnitSize = unitSize.length > 0;
      if (hasCase && hasUnitSize && hasMeasure && hasUnit) {
        options.add(`case (${caseSize} x ${unitSize}${measure} (${unit}))`);
      }
      if (hasUnitSize && hasMeasure && hasUnit) {
        options.add(`${unit} (${unitSize}${measure})`);
      }
      if (hasMeasure) {
        options.add(`${measure}`);
      }
    }
    return Array.from(options);
  }, [packaging]);

  // Initialize reporting rows on open and keep units valid when options change
  useEffect(() => {
    if (!open) return;
    setReportingRows((prev) => {
      // If no rows yet, create one default row based on options
      if (!prev || prev.length === 0) {
        const first = reportingUnitOptions[0] || "";
        return [
          {
            id: `rep_${Date.now()}`,
            unit: first,
            cost: "",
            isDefault: true,
          },
        ];
      }
      // Ensure existing rows have valid unit values against current options
      const first = reportingUnitOptions[0] || "";
      let changed = false;
      const next = prev.map((r) => {
        if (r.unit && reportingUnitOptions.includes(r.unit)) return r;
        changed = true;
        return { ...r, unit: first };
      });
      return changed ? next : prev;
    });
  }, [open, reportingUnitOptions]);
  const isPackagingComplete = (p: PackagingForm) =>
    p.unitSize.trim().length > 0 &&
    p.measureType.trim().length > 0 &&
    p.unitType.trim().length > 0;
  const firstPackagingComplete =
    packaging.length > 0 && isPackagingComplete(packaging[0]);

  // Compute dirty flag for edit mode by comparing current state to original snapshot
  const editDirty = useMemo(() => {
    if (!productId || !original) return false;
    if (
      name.trim() !== original.name ||
      sku.trim() !== original.sku ||
      categoryId !== original.categoryId ||
      subcategoryId !== original.subcategoryId ||
      notes.trim() !== original.notes
    ) {
      return true;
    }
    if (packaging.length !== original.packaging.length) return true;
    for (let i = 0; i < packaging.length; i++) {
      const cur = packaging[i];
      const orig = original.packaging[i];
      if (
        (cur.caseSize || "").trim() !== (orig.caseSize || "").trim() ||
        (cur.unitSize || "").trim() !== (orig.unitSize || "").trim() ||
        (cur.measureType || "").trim() !== (orig.measureType || "").trim() ||
        (cur.unitType || "").trim() !== (orig.unitType || "").trim() ||
        (cur.price || "").trim() !== (orig.price || "").trim() ||
        (cur.vendorId || "").trim() !== (orig.vendorId || "").trim()
      ) {
        return true;
      }
    }
    return false;
  }, [
    productId,
    original,
    name,
    sku,
    categoryId,
    subcategoryId,
    notes,
    packaging,
  ]);

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
      setCategoryId("");
      setSubcategoryId("");
      setReportingRows([
        {
          id: `rep_${Date.now()}`,
          unit: reportingUnitOptions[0] || "",
          cost: "",
          isDefault: true,
        },
      ]);
      setPackaging([
        {
          id: `pkg_${Date.now()}`,
          caseSize: "",
          unitSize: "750",
          measureType: "mL",
          unitType: "bottle",
          price: "",
          vendorId: "",
        },
      ]);
      setOriginal(null);
    }
  }, [open, reportingUnitOptions]);

  // Load existing product when editing
  useEffect(() => {
    let mounted = true;
    async function loadProduct() {
      if (!open || !productId) return;
      setLoadingProduct(true);
      const { data, error } = await supabase
        .from("drink_products")
        .select(
          "id, name, sku, category, subcategory, category_id, subcategory_id, vendor, price, notes"
        )
        .eq("id", productId)
        .single();
      if (error || !data) return;
      if (!mounted) return;
      setName(String(data.name || ""));
      setSku(String(data.sku || ""));
      setCategory(String(data.category || ""));
      setSubcategory(String(data.subcategory || ""));
      setCategoryId(String(data.category_id || ""));
      setSubcategoryId(String(data.subcategory_id || ""));
      setNotes(String(data.notes || ""));
      // Load packaging rows for this product
      const { data: pkgRows } = await supabase
        .from("drink_products_packaging")
        .select(
          "units_per_case, unit_volume, measure_type, unit_type, price, vendor_id"
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (pkgRows && pkgRows.length > 0) {
        setPackaging(
          pkgRows.map((r) => ({
            id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            caseSize: r.units_per_case != null ? String(r.units_per_case) : "",
            unitSize: r.unit_volume != null ? String(r.unit_volume) : "",
            measureType: String(r.measure_type || ""),
            unitType: String(r.unit_type || ""),
            price: r.price != null ? String(r.price) : "",
            vendorId: r.vendor_id != null ? String(r.vendor_id) : "",
          }))
        );
      } else {
        setPackaging([
          {
            id: `pkg_${Date.now()}`,
            caseSize: "",
            unitSize: "",
            measureType: "",
            unitType: "",
            price: "",
            vendorId: "",
          },
        ]);
      }
      // Capture original snapshot after state is set (next tick)
      setTimeout(() => {
        setOriginal({
          name: String(data.name || ""),
          sku: String(data.sku || ""),
          categoryId: String(data.category_id || ""),
          subcategoryId: String(data.subcategory_id || ""),
          notes: String(data.notes || ""),
          packaging: (pkgRows || []).map((r) => ({
            caseSize: r.units_per_case != null ? String(r.units_per_case) : "",
            unitSize: r.unit_volume != null ? String(r.unit_volume) : "",
            measureType: String(r.measure_type || ""),
            unitType: String(r.unit_type || ""),
            price: r.price != null ? String(r.price) : "",
            vendorId: r.vendor_id != null ? String(r.vendor_id) : "",
          })),
        });
      }, 0);
      setLoadingProduct(false);
    }
    loadProduct();
    return () => {
      mounted = false;
    };
  }, [open, productId]);

  // When switching to Add mode while the drawer is open, clear the form and packaging
  useEffect(() => {
    if (open && !productId) {
      setName("");
      setSku("");
      setCategory("");
      setSubcategory("");
      setCategoryId("");
      setSubcategoryId("");
      setNotes("");
      setSaveError(null);
      setPackaging([
        {
          id: `pkg_${Date.now()}`,
          caseSize: "",
          unitSize: "750",
          measureType: "mL",
          unitType: "bottle",
          price: "",
          vendorId: "",
        },
      ]);
      // Let reporting rows initialize via the reportingUnitOptions effect
      setReportingRows([]);
    }
  }, [open, productId]);

  useEffect(() => {
    let mounted = true;
    async function loadVendors() {
      if (!open || !businessId) return;
      setVendorsLoading(true);
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("id, name")
          .eq("business_id", businessId)
          .order("name", { ascending: true });
        if (error) return;
        if (!mounted) return;
        setVendorChoices(
          (data || [])
            .filter((v) => v.id && v.name)
            .map((v) => ({ id: String(v.id), name: String(v.name) }))
        );
      } finally {
        if (mounted) setVendorsLoading(false);
      }
    }
    loadVendors();
    return () => {
      mounted = false;
    };
  }, [open, businessId]);

  // Load categories and subcategories on open
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      if (!open || !businessId) return;
      setCategoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from("drink_categories")
          .select("id, name")
          .eq("business_id", businessId)
          .order("name", { ascending: true });
        if (error) return;
        if (!mounted) return;
        setCategoryOptions(
          (data || []).map((r) => ({
            id: String(r.id),
            name: String(r.name || ""),
          }))
        );
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    }
    async function loadSubcategories() {
      if (!open || !businessId) return;
      setSubcategoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from("drink_subcategories")
          .select("id, name")
          .eq("business_id", businessId)
          .order("name", { ascending: true });
        if (error) return;
        if (!mounted) return;
        setSubcategoryOptions(
          (data || []).map((r) => ({
            id: String(r.id),
            name: String(r.name || ""),
          }))
        );
      } finally {
        if (mounted) setSubcategoriesLoading(false);
      }
    }
    loadCategories();
    loadSubcategories();
    return () => {
      mounted = false;
    };
  }, [open, businessId]);

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
              {productId ? "Edit Drink Product" : "Add Drink Product"}
            </h3>
            <p className="text-xs text-gray-600">
              {productId
                ? "Update item details."
                : "Enter details for a new item."}
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
          {productId && loadingProduct ? (
            <div className="h-full w-full flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="h-5 w-5 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
                <span>Loading…</span>
              </div>
            </div>
          ) : (
            <div>
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
                    <select
                      className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                      value={categoryId}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id === "__new_category__") {
                          setManageCategoriesOpen(true);
                          return;
                        }
                        setCategoryId(id);
                        const found = categoryOptions.find((c) => c.id === id);
                        setCategory(found?.name || "");
                      }}
                      disabled={categoriesLoading}
                    >
                      <option value="">Select a category…</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new_category__">
                        + Manage categories…
                      </option>
                    </select>
                    {/* Inline add removed; modal will be used instead */}
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
                    <select
                      className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                      value={subcategoryId}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id === "__manage_subcategories__") {
                          setManageSubcategoriesOpen(true);
                          return;
                        }
                        setSubcategoryId(id);
                        const found = subcategoryOptions.find(
                          (s) => s.id === id
                        );
                        setSubcategory(found?.name || "");
                      }}
                      disabled={subcategoriesLoading}
                    >
                      <option value="">Select a subcategory…</option>
                      {subcategoryOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="__manage_subcategories__">
                        + Manage subcategories…
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Packaging items */}
              <PackagingItems
                packaging={packaging}
                setPackaging={setPackaging}
                measureOptions={measureOptions}
                unitTypeOptions={unitTypeOptions}
                vendorChoices={vendorChoices}
                vendorsLoading={vendorsLoading}
                onRequestDelete={(rowId) => {
                  setPkgToDelete(rowId);
                  setPkgConfirmOpen(true);
                }}
              />

              <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4 my-4">
                <h4 className="text-sm font-semibold text-[var(--oe-black)]">
                  Reporting
                </h4>
                <div className="mt-3 space-y-3">
                  {reportingRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-12 gap-3 relative ring-1 ring-gray-100 rounded-lg p-3"
                    >
                      {reportingRows.length > 1 && (
                        <button
                          type="button"
                          aria-label="Delete reporting"
                          className="absolute top-2 right-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600"
                          style={{
                            height: 28,
                            width: 28,
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => {
                            setReportingRows((prev) =>
                              prev.filter((r) => r.id !== row.id)
                            );
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
                      <div className="col-span-12 sm:col-span-6 flex items-end gap-3">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="defaultReporting"
                            className="h-4 w-4 text-[var(--oe-green)]"
                            checked={row.isDefault}
                            onChange={() =>
                              setReportingRows((prev) =>
                                prev.map((r) => ({
                                  ...r,
                                  isDefault: r.id === row.id,
                                }))
                              )
                            }
                            aria-label="Default reporting"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700">
                            Reporting Unit
                          </label>
                          <select
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-2 py-2 text-sm text-[var(--oe-black)] focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                            value={row.unit}
                            onChange={(e) =>
                              setReportingRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, unit: e.target.value }
                                    : r
                                )
                              )
                            }
                            disabled={reportingUnitOptions.length === 0}
                          >
                            {reportingUnitOptions.length === 0 ? (
                              <option value="">
                                No options yet (fill packaging)
                              </option>
                            ) : (
                              reportingUnitOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-gray-700">
                          Cost
                        </label>
                        <input
                          className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                          placeholder="$0.00"
                          value={row.cost}
                          onChange={(e) =>
                            setReportingRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? { ...r, cost: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setReportingRows((prev) => [
                          ...prev,
                          {
                            id: `rep_${Date.now()}_${Math.random()
                              .toString(36)
                              .slice(2)}`,
                            unit: reportingUnitOptions[0] || "",
                            cost: "",
                            isDefault: prev.length === 0,
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
                      Add reporting
                    </button>
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
          )}
        </div>

        <DrawerActionsBar
          showDelete={Boolean(productId)}
          deleting={deleting}
          saving={saving}
          canSave={
            !(
              saving ||
              !name.trim() ||
              !businessId ||
              (!productId && !firstPackagingComplete) ||
              (productId && !editDirty)
            )
          }
          onCancel={onClose}
          onDeleteClick={() => setDeleteConfirmOpen(true)}
          onSave={async () => {
            if (!name.trim()) {
              setSaveError("Product name is required");
              return;
            }
            if (!businessId) {
              setSaveError("Missing business context.");
              return;
            }
            if (!productId && !firstPackagingComplete) {
              setSaveError("Please complete the first packaging fields.");
              return;
            }
            setSaveError(null);
            setSaving(true);
            try {
              if (!productId) {
                const row = {
                  business_id: businessId,
                  name: name.trim(),
                  brand_name: null as string | null,
                  category: category.trim() || null,
                  subcategory: subcategory.trim() || null,
                  category_id: categoryId || null,
                  subcategory_id: subcategoryId || null,
                  vendor: null as string | null,
                  sku: sku.trim() || null,
                  price: null as number | null,
                  notes: notes.trim() || null,
                };
                const { data: inserted, error } = await supabase
                  .from("drink_products")
                  .insert([row])
                  .select("id")
                  .single();
                if (error) {
                  setSaveError(error.message || "Failed to save product.");
                } else if (inserted?.id) {
                  const packagingRows = packaging
                    .filter(isPackagingComplete)
                    .map((p) => {
                      const priceRaw = (p.price || "").trim();
                      const priceParsed = priceRaw
                        ? Number.parseFloat(priceRaw.replace(/[^0-9.]/g, ""))
                        : NaN;
                      const priceValue = Number.isFinite(priceParsed)
                        ? Number(priceParsed.toFixed(2))
                        : null;
                      return {
                        product_id: inserted.id,
                        units_per_case: p.caseSize.trim()
                          ? parseInt(p.caseSize, 10)
                          : null,
                        unit_volume: parseFloat(p.unitSize),
                        measure_type: p.measureType,
                        unit_type: p.unitType,
                        price: priceValue as number | null,
                        vendor_id: p.vendorId || null,
                        notes: null as string | null,
                      };
                    });
                  if (packagingRows.length > 0) {
                    const { error: pkgError } = await supabase
                      .from("drink_products_packaging")
                      .insert(packagingRows);
                    if (pkgError) {
                      setSaveError(
                        pkgError.message || "Failed to save packaging."
                      );
                      return;
                    }
                  }
                  onClose();
                  if (onSaved) {
                    onSaved();
                  }
                }
              } else {
                const updates = {
                  name: name.trim(),
                  category: category.trim() || null,
                  subcategory: subcategory.trim() || null,
                  category_id: categoryId || null,
                  subcategory_id: subcategoryId || null,
                  vendor: null as string | null,
                  sku: sku.trim() || null,
                  price: null as number | null,
                  notes: notes.trim() || null,
                };
                const { error } = await supabase
                  .from("drink_products")
                  .update(updates)
                  .eq("id", productId);
                if (error) {
                  setSaveError(error.message || "Failed to update product.");
                } else {
                  // Optional: update packaging too when editing (simple approach: delete+insert)
                  const { error: delErr } = await supabase
                    .from("drink_products_packaging")
                    .delete()
                    .eq("product_id", productId);
                  if (delErr) {
                    setSaveError(
                      delErr.message || "Failed to update packaging."
                    );
                    return;
                  }
                  const packagingRows = packaging
                    .filter(isPackagingComplete)
                    .map((p) => {
                      const priceRaw = (p.price || "").trim();
                      const priceParsed = priceRaw
                        ? Number.parseFloat(priceRaw.replace(/[^0-9.]/g, ""))
                        : NaN;
                      const priceValue = Number.isFinite(priceParsed)
                        ? Number(priceParsed.toFixed(2))
                        : null;
                      return {
                        product_id: productId,
                        units_per_case: p.caseSize.trim()
                          ? parseInt(p.caseSize, 10)
                          : null,
                        unit_volume: parseFloat(p.unitSize),
                        measure_type: p.measureType,
                        unit_type: p.unitType,
                        price: priceValue as number | null,
                        vendor_id: p.vendorId || null,
                        notes: null as string | null,
                      };
                    });
                  if (packagingRows.length > 0) {
                    const { error: insErr } = await supabase
                      .from("drink_products_packaging")
                      .insert(packagingRows);
                    if (insErr) {
                      setSaveError(
                        insErr.message || "Failed to update packaging."
                      );
                      return;
                    }
                  }
                  // Refresh original snapshot and close
                  setOriginal({
                    name: name.trim(),
                    sku: sku.trim(),
                    categoryId: categoryId || "",
                    subcategoryId: subcategoryId || "",
                    notes: notes.trim(),
                    packaging: packaging.map((p) => ({
                      caseSize: (p.caseSize || "").trim(),
                      unitSize: (p.unitSize || "").trim(),
                      measureType: (p.measureType || "").trim(),
                      unitType: (p.unitType || "").trim(),
                      price: (p.price || "").trim(),
                      vendorId: (p.vendorId || "").trim(),
                    })),
                  });
                  onClose();
                  if (onSaved) {
                    onSaved();
                  }
                }
              }
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
      <ManageDrinkCategoriesModal
        isOpen={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        businessId={businessId}
        onAdded={(inserted) => {
          setCategoryOptions((prev) => {
            const next = [...prev, inserted].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            return next;
          });
          setCategoryId(inserted.id);
          setCategory(inserted.name);
        }}
        onDeleted={(deletedId) => {
          setCategoryOptions((prev) => prev.filter((c) => c.id !== deletedId));
          setCategoryId((currentId) => {
            if (currentId === deletedId) {
              setCategory("");
              return "";
            }
            return currentId;
          });
        }}
        onRenamed={(id, name) => {
          setCategoryOptions((prev) => {
            const next = prev.map((c) => (c.id === id ? { ...c, name } : c));
            next.sort((a, b) => a.name.localeCompare(b.name));
            return next;
          });
          setCategoryId((currentId) => {
            if (currentId === id) {
              setCategory(name);
            }
            return currentId;
          });
        }}
      />
      <ManageDrinkSubcategoriesModal
        isOpen={manageSubcategoriesOpen}
        onClose={() => setManageSubcategoriesOpen(false)}
        businessId={businessId}
        onAdded={(inserted) => {
          setSubcategoryOptions((prev) => {
            const next = [...prev, inserted].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            return next;
          });
          setSubcategoryId(inserted.id);
          setSubcategory(inserted.name);
        }}
        onDeleted={(deletedId) => {
          setSubcategoryOptions((prev) =>
            prev.filter((s) => s.id !== deletedId)
          );
          setSubcategoryId((currentId) => {
            if (currentId === deletedId) {
              setSubcategory("");
              return "";
            }
            return currentId;
          });
        }}
        onRenamed={(id, name) => {
          setSubcategoryOptions((prev) => {
            const next = prev.map((s) => (s.id === id ? { ...s, name } : s));
            next.sort((a, b) => a.name.localeCompare(b.name));
            return next;
          });
          setSubcategoryId((currentId) => {
            if (currentId === id) {
              setSubcategory(name);
            }
            return currentId;
          });
        }}
      />
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
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete product?"
        message="This will delete the product and all associated packaging."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={async () => {
          if (!productId) return;
          setDeleting(true);
          try {
            const { error } = await supabase
              .from("drink_products")
              .delete()
              .eq("id", productId);
            if (error) {
              setSaveError(error.message || "Failed to delete product.");
              return;
            }
            setDeleteConfirmOpen(false);
            onClose();
            if (onSaved) onSaved();
          } finally {
            setDeleting(false);
          }
        }}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}
