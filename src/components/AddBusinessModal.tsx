import { useState } from "react";
import { supabase } from "../services/supabase";

type AddBusinessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddBusinessModal({
  isOpen,
  onClose,
  onCreated,
}: AddBusinessModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("United States");
  const [stateProv, setStateProv] = useState("Alabama");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    if (!businessName || !address1 || !city || !zip) {
      setErrorMessage("Please complete the required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setErrorMessage("You must be logged in to create a business.");
        return;
      }
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .insert({
          business_name: businessName,
          created_by_user: userId,
          business_address:
            address1 +
            " " +
            address2 +
            ", " +
            city +
            ", " +
            stateProv +
            ", " +
            country +
            ", " +
            zip,
        })
        .select("id")
        .single();
      if (bizError) {
        setErrorMessage(bizError.message);
        return;
      }
      const businessId = biz?.id as string | undefined;
      if (!businessId) {
        setErrorMessage("Failed to create business. Please try again.");
        return;
      }
      const { error: roleError } = await supabase
        .from("user_business_roles")
        .insert({ user_id: userId, business_id: businessId, role: "admin" });
      if (roleError) {
        setErrorMessage(roleError.message);
        return;
      }
      onCreated?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create business.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 text-[var(--oe-black)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add your business</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 hover:bg-black/5"
          >
            ✕
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Establishment name
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
              placeholder="Your restaurant"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address line 1
            </label>
            <input
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address line 2
            </label>
            <input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
              placeholder="Suite, floor, unit..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm ring-1 ring-black/10 focus:ring-black/20"
            >
              <option>United States</option>
              <option>Canada</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <select
                value={stateProv}
                onChange={(e) => setStateProv(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm ring-1 ring-black/10 focus:ring-black/20"
              >
                <option>Alabama</option>
                <option>California</option>
                <option>New York</option>
                <option>Texas</option>
                <option>Ontario</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                />
              </div>
            </div>
          </div>
          {errorMessage && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm bg-black/5 hover:bg-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md px-4 py-2 text-sm bg-[var(--oe-green)] text-black font-medium hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
