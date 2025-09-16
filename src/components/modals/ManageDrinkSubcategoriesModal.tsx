import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import ConfirmModal from "../ConfirmModal";

type Subcategory = { id: string; name: string };

export default function ManageDrinkSubcategoriesModal({
  isOpen,
  onClose,
  businessId,
  onAdded,
  onDeleted,
  onRenamed,
}: {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onAdded?: (s: Subcategory) => void;
  onDeleted?: (id: string) => void;
  onRenamed?: (id: string, name: string) => void;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newName, setNewName] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [toDelete, setToDelete] = useState<Subcategory | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [renaming, setRenaming] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isOpen || !businessId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("drink_subcategories")
          .select("id, name")
          .eq("business_id", businessId)
          .order("name", { ascending: true });
        if (err) throw err;
        if (!mounted) return;
        setSubcategories(
          (data || []).map((r) => ({
            id: String(r.id),
            name: String(r.name || ""),
          }))
        );
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Failed to load subcategories";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, businessId]);

  async function addSubcategory() {
    const name = newName.trim();
    if (!name || !businessId) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("drink_subcategories")
        .insert({ business_id: businessId, name })
        .select("id, name")
        .single();
      if (!error && data) {
        const inserted: Subcategory = {
          id: String(data.id),
          name: String(data.name || name),
        };
        setSubcategories((prev) =>
          [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name))
        );
        setNewName("");
        setShowAdd(false);
        if (onAdded) onAdded(inserted);
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteSubcategory(s: Subcategory) {
    if (!businessId) return;
    setDeleting(true);
    try {
      await supabase
        .from("drink_subcategories")
        .delete()
        .eq("id", s.id)
        .eq("business_id", businessId);
      setSubcategories((prev) => prev.filter((c) => c.id !== s.id));
      if (onDeleted) onDeleted(s.id);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  async function renameSubcategory(id: string) {
    const name = editName.trim();
    if (!name || !businessId) return;
    setRenaming(true);
    try {
      const { error } = await supabase
        .from("drink_subcategories")
        .update({ name })
        .eq("id", id)
        .eq("business_id", businessId);
      if (!error) {
        setSubcategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, name } : c));
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
        if (onRenamed) onRenamed(id, name);
        setEditingId(null);
        setEditName("");
      }
    } finally {
      setRenaming(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-[var(--oe-black)] shadow-xl ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">List of Subcategories</h3>
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

        <div className="mt-5 max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-600">Loading…</div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : subcategories.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">
              No subcategories yet.
            </div>
          ) : (
            <div className="space-y-2">
              {subcategories.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl px-5 py-3 text-sm bg-gray-100 hover:bg-gray-200"
                >
                  {editingId === s.id ? (
                    <>
                      <input
                        className="mr-2 flex-1 rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void renameSubcategory(s.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Confirm rename"
                          className={`rounded-md ${
                            !editName.trim() || renaming
                              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                              : "bg-[var(--oe-green)] text-black hover:opacity-90"
                          }`}
                          style={{
                            height: 28,
                            width: 28,
                            display: "grid",
                            placeItems: "center",
                          }}
                          disabled={!editName.trim() || renaming}
                          onClick={() => renameSubcategory(s.id)}
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
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel rename"
                          className="rounded-md bg-red-50 hover:bg-red-100 text-red-600"
                          style={{
                            height: 28,
                            width: 28,
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
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
                    </>
                  ) : (
                    <>
                      <span className="truncate">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Rename ${s.name}`}
                          className="rounded-md bg-black/5 hover:bg-black/10 text-[var(--oe-black)]"
                          style={{
                            height: 28,
                            width: 28,
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => {
                            setEditingId(s.id);
                            setEditName(s.name);
                          }}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M4 21h4l11-11-4-4L4 17v4z" />
                            <path d="M14 7l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${s.name}`}
                          className="rounded-md bg-red-50 hover:bg-red-100 text-red-600"
                          style={{
                            height: 28,
                            width: 28,
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => setToDelete(s)}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {showAdd && (
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-gray-50 border border-transparent px-3 py-2 text-sm focus:border-[var(--oe-green)]/40 focus:ring-2 focus:ring-[var(--oe-green)]/30 outline-none"
                placeholder="New subcategory name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addSubcategory();
                }}
                autoFocus
              />
              <button
                type="button"
                aria-label="Confirm add subcategory"
                className={`rounded-md ${
                  !newName.trim() || adding
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-[var(--oe-green)] text-black hover:opacity-90"
                }`}
                style={{
                  height: 36,
                  width: 36,
                  display: "grid",
                  placeItems: "center",
                }}
                disabled={!newName.trim() || adding}
                onClick={addSubcategory}
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
              </button>
              <button
                type="button"
                aria-label="Cancel add subcategory"
                className="rounded-md bg-red-50 hover:bg-red-100 text-red-600"
                style={{
                  height: 36,
                  width: 36,
                  display: "grid",
                  placeItems: "center",
                }}
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
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
          )}
          {!showAdd && (
            <div className="flex justify-start">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm text-[var(--oe-black)] hover:bg-black/10"
                onClick={() => setShowAdd(true)}
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
                Add subcategory
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Delete subcategory?"
        message={
          toDelete ? (
            <span>
              Are you sure you want to delete <strong>{toDelete.name}</strong>?
            </span>
          ) : (
            ""
          )
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={() => {
          if (toDelete) void deleteSubcategory(toDelete);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
