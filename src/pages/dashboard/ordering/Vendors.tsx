import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../../components/ConfirmModal";
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

export default function OrderingVendors({
  addVendorOpen = false,
  onCloseAddVendor,
}: {
  addVendorOpen?: boolean;
  onCloseAddVendor?: () => void;
}) {
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

  const deliveryDaysFromVendor = useMemo(() => {
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
        p.startsWith("mon")
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
          : p.startsWith("sun")
          ? "Sunday"
          : ""
      )
      .filter(Boolean);
    return new Set<string>(norm);
  }, [selectedVendor?.delivery_days]);

  type VendorForm = {
    name: string;
    account_number: string;
    office_phone: string;
    website: string;
    notes: string;
    case_min: string; // keep as string for input control
    dollar_min: string; // keep as string
    delivery_days: Set<string>;
  };

  const [vendorForm, setVendorForm] = useState<VendorForm>({
    name: "",
    account_number: "",
    office_phone: "",
    website: "",
    notes: "",
    case_min: "",
    dollar_min: "",
    delivery_days: new Set<string>(),
  });

  useEffect(() => {
    // Initialize form when vendor changes
    setVendorForm({
      name: selectedVendor?.name || "",
      account_number: selectedVendor?.account_number || "",
      office_phone: selectedVendor?.office_phone || "",
      website: selectedVendor?.website || "",
      notes: selectedVendor?.notes || "",
      case_min:
        selectedVendor?.case_min === null ||
        selectedVendor?.case_min === undefined
          ? ""
          : String(selectedVendor?.case_min),
      dollar_min:
        selectedVendor?.dollar_min === null ||
        selectedVendor?.dollar_min === undefined
          ? ""
          : String(selectedVendor?.dollar_min),
      delivery_days: deliveryDaysFromVendor,
    });
    setVendorDirty(false);
    setEditingName(false);
  }, [
    selectedVendor?.id,
    selectedVendor?.name,
    selectedVendor?.account_number,
    selectedVendor?.office_phone,
    selectedVendor?.website,
    selectedVendor?.notes,
    selectedVendor?.case_min,
    selectedVendor?.dollar_min,
    deliveryDaysFromVendor,
  ]);

  function toggleDeliveryDay(day: string): void {
    setVendorForm((prev) => {
      const next = new Set(prev.delivery_days);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return { ...prev, delivery_days: next };
    });
    setVendorDirty(true);
  }

  const [saving, setSaving] = useState<boolean>(false);
  const [vendorDirty, setVendorDirty] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<boolean>(false);
  const [vendorNameError, setVendorNameError] = useState<string | null>(null);
  const [saveBlockedMsg, setSaveBlockedMsg] = useState<string | null>(null);
  const [vendorConfirmOpen, setVendorConfirmOpen] = useState<boolean>(false);
  const [deletingVendor, setDeletingVendor] = useState<boolean>(false);
  async function saveVendorUpdates() {
    if (!selectedVendor?.id) return;
    setSaving(true);
    // Validate vendor name
    if (!vendorForm.name.trim()) {
      setVendorNameError("Vendor name is required");
      setSaveBlockedMsg("Could not save. Please fix the highlighted errors.");
      setSaving(false);
      return;
    } else {
      setVendorNameError(null);
    }
    // Validate newly added reps (require name and email)
    const nextErrors: Record<
      string,
      { name?: string; email?: string; phone?: string }
    > = {};
    const newReps = reps.filter((r) => r.id.startsWith("tmp_"));
    newReps.forEach((r) => {
      const errs: { name?: string; email?: string; phone?: string } = {};
      if (!r.name?.trim()) errs.name = "Rep name is required";
      if (!/.+@.+\..+/.test(r.email || ""))
        errs.email = "Valid email is required";
      if (errs.name || errs.email) nextErrors[r.id] = errs;
    });
    // Validate phone presence when send by text is enabled
    reps.forEach((r) => {
      if (r.sendText && !r.phone.trim()) {
        nextErrors[r.id] = {
          ...(nextErrors[r.id] || {}),
          phone: "Phone is required when sending by text",
        };
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setRepErrors(nextErrors);
      setSaveBlockedMsg("Could not save. Please fix the highlighted errors.");
      setSaving(false);
      return;
    }
    // Convert delivery days to CSV of full names
    const deliveryCsv = Array.from(vendorForm.delivery_days).join(",");
    const updates: {
      name: string;
      account_number: string | null;
      office_phone: string | null;
      website: string | null;
      notes: string | null;
      case_min: number | null;
      dollar_min: number | null;
      delivery_days: string | null;
      updated_at: string;
    } = {
      name: vendorForm.name.trim(),
      account_number: vendorForm.account_number.trim() || null,
      office_phone: vendorForm.office_phone.trim() || null,
      website: vendorForm.website.trim() || null,
      notes: vendorForm.notes.trim() || null,
      case_min:
        vendorForm.case_min === ""
          ? null
          : Math.max(0, parseInt(vendorForm.case_min, 10) || 0),
      dollar_min:
        vendorForm.dollar_min === ""
          ? null
          : (Number(vendorForm.dollar_min) as number),
      delivery_days: deliveryCsv || null,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await supabase
      .from("vendors")
      .update(updates)
      .eq("id", selectedVendor.id);
    if (!err) {
      // Persist reps changes (UI-based):
      // 1) Delete reps marked for deletion
      if (deletedRepIds.length > 0) {
        await supabase.from("vendors_reps").delete().in("id", deletedRepIds);
        setDeletedRepIds([]);
      }
      // 2) Split reps into new (tmp_ ids) and existing; insert new with select to fetch IDs, update existing
      const newReps = reps.filter((r) => r.id.startsWith("tmp_"));
      const existingReps = reps.filter((r) => !r.id.startsWith("tmp_"));
      if (newReps.length > 0) {
        const { data: inserted } = await supabase
          .from("vendors_reps")
          .insert(
            newReps.map((r) => ({
              vendor_id: selectedVendor.id,
              name: r.name?.trim() || "",
              email: r.email?.trim() || null,
              phone: r.phone?.trim() || null,
              send_by_email: !!r.sendEmail,
              send_by_text: !!r.sendText,
            }))
          )
          .select();
        if (inserted && inserted.length > 0) {
          // Replace tmp ids with real ids
          let idx = 0;
          setReps((prev) =>
            prev.map((r) =>
              r.id.startsWith("tmp_")
                ? { ...r, id: (inserted[idx++]?.id as string) || r.id }
                : r
            )
          );
        }
      }
      if (existingReps.length > 0) {
        await Promise.all(
          existingReps.map((r) =>
            supabase
              .from("vendors_reps")
              .update({
                name: r.name?.trim() || "",
                email: r.email?.trim() || null,
                phone: r.phone?.trim() || null,
                send_by_email: !!r.sendEmail,
                send_by_text: !!r.sendText,
              })
              .eq("id", r.id)
          )
        );
      }

      // Reflect vendor changes locally in the list
      setVendors((prev) =>
        (prev || []).map((v) =>
          v.id === selectedVendor.id ? { ...v, ...updates } : v
        )
      );

      // Mark as saved and disable the Save button again
      setVendorDirty(false);
      setJustSaved(true);
      // Clear any lingering rep field errors after a successful save
      setRepErrors({});
      setSaveBlockedMsg(null);
      setTimeout(() => setJustSaved(false), 2500);
    }
    setSaving(false);
  }

  async function confirmDeleteVendor() {
    if (!selectedVendor?.id) return;
    setDeletingVendor(true);
    try {
      const currentId = selectedVendor.id;
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", currentId);
      if (!error) {
        setVendors((prev) => (prev || []).filter((v) => v.id !== currentId));
        // choose next selection
        const idx = Math.min(
          selectedIndex,
          Math.max(0, (vendors?.length || 1) - 2)
        );
        setSelectedIndex(idx);
        setVendorDirty(false);
        setEditingName(false);
      }
    } finally {
      setDeletingVendor(false);
      setVendorConfirmOpen(false);
    }
  }

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
    id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: "",
    email: "",
    phone: "",
    sendEmail: true,
    attachCsv: false,
    sendText: false,
  });

  const [reps, setReps] = useState<RepForm[]>([]);
  const [repsLoading, setRepsLoading] = useState<boolean>(false);
  const [deletedRepIds, setDeletedRepIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [repToDelete, setRepToDelete] = useState<string | null>(null);
  const [repErrors, setRepErrors] = useState<
    Record<string, { name?: string; email?: string; phone?: string }>
  >({});
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [newVendorName, setNewVendorName] = useState<string>("");

  useEffect(() => {
    if (addVendorOpen) setCreateOpen(true);
  }, [addVendorOpen]);

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
        .select("id, name, email, phone, send_by_email, send_by_text")
        .eq("vendor_id", selectedVendor.id)
        .order("name", { ascending: true });
      if (!mounted) return;
      if (err) {
        // On error, just show empty and allow adding manually
        setReps([]);
      } else {
        type RepRow = {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          send_by_email: boolean | null;
          send_by_text: boolean | null;
        };
        const mapped: RepForm[] = ((data as RepRow[]) || []).map((r) => ({
          id: r.id,
          name: r.name || "",
          email: r.email || "",
          phone: r.phone || "",
          sendEmail: r.send_by_email ?? true,
          attachCsv: false,
          sendText: r.send_by_text ?? false,
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
    setVendorDirty(true);

    if (
      key === "name" ||
      key === "email" ||
      key === "phone" ||
      key === "sendText"
    ) {
      setRepErrors((prev) => {
        const next = { ...prev };
        const curr = { ...(next[id] || {}) } as {
          name?: string;
          email?: string;
          phone?: string;
        };
        if (key === "name") {
          const val = String(value || "");
          if (val.trim()) delete curr.name;
          else curr.name = "Rep name is required";
        }
        if (key === "email") {
          const val = String(value || "");
          const ok = /.+@.+\..+/.test(val);
          if (ok) delete curr.email;
          else curr.email = "Valid email is required";
        }
        if (key === "phone" || key === "sendText") {
          const rep = reps.find((r) => r.id === id);
          const sendText =
            key === "sendText" ? Boolean(value) : Boolean(rep?.sendText);
          const phone =
            key === "phone" ? String(value || "") : String(rep?.phone || "");
          if (sendText && !phone.trim()) {
            curr.phone = "Phone is required when sending by text";
          } else {
            delete curr.phone;
          }
        }
        if (!curr.name && !curr.email && !curr.phone) {
          delete next[id];
        } else {
          next[id] = curr;
        }
        return next;
      });
      if (saveBlockedMsg) setSaveBlockedMsg(null);
    }
  }

  function requestRemoveRep(id: string) {
    setRepToDelete(id);
    setConfirmOpen(true);
  }

  async function actuallyRemoveRep() {
    if (!repToDelete) return;
    const id = repToDelete;
    if (!id.startsWith("tmp_")) {
      await supabase.from("vendors_reps").delete().eq("id", id);
      // Ensure not queued anymore
      setDeletedRepIds((prev) => prev.filter((d) => d !== id));
    }
    setReps((prev) => prev.filter((r) => r.id !== id));
    setRepToDelete(null);
    setConfirmOpen(false);
  }

  return (
    <div className="grid grid-cols-12 gap-6 mt-6">
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
          {/* Create Vendor Modal */}
          {createOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                  setCreateOpen(false);
                  setNewVendorName("");
                  onCloseAddVendor?.();
                }}
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-[var(--oe-black)]">
                <h3 className="text-lg font-semibold">Add a Vendor</h3>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600">
                    Vendor name
                  </label>
                  <input
                    className="mt-1 w-full rounded-md bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="e.g., Ruby Wines"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        (async () => {
                          // Reuse the same add logic as the button
                          if (!newVendorName.trim() || creating) return;
                          await supabase.auth.getSession();
                          let businessId: string | null = null;
                          try {
                            businessId = localStorage.getItem(
                              "oe_current_business_id"
                            );
                          } catch {
                            /* ignore */
                          }
                          if (!businessId) return;
                          setCreating(true);
                          const { data, error } = await supabase
                            .from("vendors")
                            .insert({
                              business_id: businessId,
                              name: newVendorName.trim(),
                            })
                            .select();
                          setCreating(false);
                          if (!error && data && data[0]) {
                            const v = data[0] as { id: string; name: string };
                            setVendors((prev) => {
                              const list = [
                                ...(prev || []),
                                {
                                  id: v.id,
                                  business_id: businessId!,
                                  name: v.name,
                                  notes: null,
                                  account_number: null,
                                  office_phone: null,
                                  website: null,
                                  delivery_days: null,
                                  case_min: null,
                                  dollar_min: null,
                                },
                              ];
                              return list.sort((a, b) =>
                                a.name.localeCompare(b.name)
                              );
                            });
                            const idx = (vendors || [])
                              .concat([
                                {
                                  id: v.id,
                                  business_id: businessId!,
                                  name: v.name,
                                  notes: null,
                                  account_number: null,
                                  office_phone: null,
                                  website: null,
                                  delivery_days: null,
                                  case_min: null,
                                  dollar_min: null,
                                },
                              ])
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .findIndex((x) => x.id === v.id);
                            if (idx >= 0) setSelectedIndex(idx);
                          }
                          setCreateOpen(false);
                          setNewVendorName("");
                          onCloseAddVendor?.();
                        })();
                      }
                    }}
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setCreateOpen(false);
                      setNewVendorName("");
                      onCloseAddVendor?.();
                    }}
                    className="rounded-md px-4 py-2 text-sm bg-black/5 hover:bg-black/10"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newVendorName.trim() || creating}
                    onClick={async () => {
                      if (!newVendorName.trim()) return;
                      await supabase.auth.getSession();
                      let businessId: string | null = null;
                      try {
                        businessId = localStorage.getItem(
                          "oe_current_business_id"
                        );
                      } catch {
                        /* ignore */
                      }
                      if (!businessId) return;
                      setCreating(true);
                      const { data, error } = await supabase
                        .from("vendors")
                        .insert({
                          business_id: businessId,
                          name: newVendorName.trim(),
                        })
                        .select();
                      setCreating(false);
                      if (!error && data && data[0]) {
                        const v = data[0] as { id: string; name: string };
                        setVendors((prev) => {
                          const list = [
                            ...(prev || []),
                            {
                              id: v.id,
                              business_id: businessId!,
                              name: v.name,
                              notes: null,
                              account_number: null,
                              office_phone: null,
                              website: null,
                              delivery_days: null,
                              case_min: null,
                              dollar_min: null,
                            },
                          ];
                          return list.sort((a, b) =>
                            a.name.localeCompare(b.name)
                          );
                        });
                        // Select the new vendor
                        setSelectedIndex(0);
                        const idx = (vendors || [])
                          .concat([
                            {
                              id: v.id,
                              business_id: businessId!,
                              name: v.name,
                              notes: null,
                              account_number: null,
                              office_phone: null,
                              website: null,
                              delivery_days: null,
                              case_min: null,
                              dollar_min: null,
                            },
                          ])
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .findIndex((x) => x.id === v.id);
                        if (idx >= 0) setSelectedIndex(idx);
                      }
                      setCreateOpen(false);
                      setNewVendorName("");
                      onCloseAddVendor?.();
                    }}
                    className={`rounded-md px-4 py-2 text-sm ${
                      !newVendorName.trim() || creating
                        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                        : "bg-[var(--oe-green)] text-black hover:opacity-90"
                    }`}
                  >
                    {creating ? "Adding…" : "Add Vendor"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <div className="min-w-0 flex items-center gap-2">
              {editingName && selectedVendor ? (
                <>
                  <input
                    className="w-64 sm:w-80 md:w-96 rounded-md bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    value={vendorForm.name}
                    onChange={(e) => {
                      setVendorForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      setVendorDirty(true);
                      if (saveBlockedMsg) setSaveBlockedMsg(null);
                    }}
                    placeholder="Vendor name"
                    autoFocus
                  />
                  {vendorNameError && (
                    <span className="ml-1 text-xs text-red-600">
                      {vendorNameError}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setVendorForm((prev) => ({
                        ...prev,
                        name: selectedVendor?.name || "",
                      }));
                      setEditingName(false);
                    }}
                    aria-label="Cancel edit"
                    className="shrink-0 rounded-md bg-red-50 hover:bg-red-100 text-red-600"
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
                </>
              ) : (
                <h3 className="text-lg font-semibold text-[var(--oe-black)] truncate">
                  {selectedVendor?.name || "No vendor selected"}
                </h3>
              )}
              {!editingName && selectedVendor && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs bg-black/5 hover:bg-black/10"
                  aria-label="Edit vendor name"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {justSaved && (
                <span className="text-xs font-medium text-green-600">
                  Saved
                </span>
              )}
              <button
                type="button"
                onClick={saveVendorUpdates}
                disabled={saving || !selectedVendor || !vendorDirty}
                className={`rounded-md px-3 py-2 text-sm  ${
                  saving || !selectedVendor || !vendorDirty
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-[var(--oe-green)] text-black hover:opacity-90"
                }`}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {selectedVendor && (
                <button
                  type="button"
                  onClick={() => setVendorConfirmOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm"
                >
                  <svg
                    className="h-5.5 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">
                    {deletingVendor ? "Deleting…" : "Delete Vendor"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {saveBlockedMsg && (
              <div className="rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
                {saveBlockedMsg}
              </div>
            )}
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
                    value={vendorForm.account_number}
                    onChange={(e) => {
                      setVendorForm((prev) => ({
                        ...prev,
                        account_number: e.target.value,
                      }));
                      setVendorDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Office Phone
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                    value={vendorForm.office_phone}
                    onChange={(e) => {
                      setVendorForm((prev) => ({
                        ...prev,
                        office_phone: e.target.value,
                      }));
                      setVendorDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Website
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder="https://"
                    value={vendorForm.website}
                    onChange={(e) => {
                      setVendorForm((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }));
                      setVendorDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Notes
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                    placeholder=""
                    value={vendorForm.notes}
                    onChange={(e) => {
                      setVendorForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }));
                      setVendorDirty(true);
                    }}
                  />
                </div>
              </div>

              {/* Right column: Delivery days */}
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm font-medium text-[var(--oe-black)]">
                    Delivery days
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((d) => (
                      <label
                        key={d}
                        className="inline-flex items-center gap-2 text-gray-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={vendorForm.delivery_days.has(d)}
                          onChange={() => toggleDeliveryDay(d)}
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Minimums */}
                <div className="mt-2 grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Case minimum
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                        placeholder="0"
                        value={vendorForm.case_min}
                        onChange={(e) => {
                          setVendorForm((prev) => ({
                            ...prev,
                            case_min: e.target.value,
                          }));
                          setVendorDirty(true);
                        }}
                      />
                    </div>
                    <div className="mt-4">
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
                          value={vendorForm.dollar_min}
                          onChange={(e) => {
                            setVendorForm((prev) => ({
                              ...prev,
                              dollar_min: e.target.value,
                            }));
                            setVendorDirty(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
                  reps.map((rep) => (
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
                          {repErrors[rep.id]?.name && (
                            <div className="mt-1 text-xs text-red-600">
                              {repErrors[rep.id]?.name}
                            </div>
                          )}
                        </div>
                        <div className="col-span-12 md:col-span-5">
                          <label className="block text-xs font-medium text-gray-600">
                            Email <span className="text-red-500">Required</span>
                          </label>
                          <input
                            type="email"
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none disabled:opacity-50"
                            placeholder="name@example.com"
                            value={rep.email}
                            onChange={(e) =>
                              updateRep(rep.id, "email", e.target.value)
                            }
                            readOnly={!rep.sendEmail}
                            disabled={!rep.sendEmail}
                          />
                          {repErrors[rep.id]?.email && (
                            <div className="mt-1 text-xs text-red-600">
                              {repErrors[rep.id]?.email}
                            </div>
                          )}
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <label className="block text-xs font-medium text-gray-600">
                            Cell Phone
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none disabled:opacity-50"
                            placeholder=""
                            value={rep.phone}
                            onChange={(e) =>
                              updateRep(rep.id, "phone", e.target.value)
                            }
                            readOnly={!rep.sendText}
                            disabled={!rep.sendText}
                          />
                          {repErrors[rep.id]?.phone && (
                            <div className="mt-1 text-xs text-red-600">
                              {repErrors[rep.id]?.phone}
                            </div>
                          )}
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
                          <span>Send orders by email</span>
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
                          <span>Send orders by text</span>
                        </label>

                        {reps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestRemoveRep(rep.id)}
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
                  onClick={() => {
                    setReps((prev) => [...prev, createEmptyRep()]);
                    setVendorDirty(true);
                  }}
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

            <ConfirmModal
              isOpen={confirmOpen}
              title="Delete rep?"
              message={
                <span>
                  This action cannot be undone. Proceed with deletion?
                </span>
              }
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onConfirm={actuallyRemoveRep}
              onClose={() => {
                setConfirmOpen(false);
                setRepToDelete(null);
              }}
            />

            <ConfirmModal
              isOpen={vendorConfirmOpen}
              title="Delete vendor?"
              message={<span>This will remove the vendor and its reps.</span>}
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onConfirm={confirmDeleteVendor}
              onClose={() => setVendorConfirmOpen(false)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
