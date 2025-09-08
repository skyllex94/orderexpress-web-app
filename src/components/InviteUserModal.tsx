import { useState } from "react";

type Role =
  | "admin"
  | "inventory_manager"
  | "ordering_manager"
  | "sales_manager";

type InviteUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (args: { email: string; role: Role }) => Promise<void> | void;
};

export default function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
}: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("inventory_manager");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await onInvite({ email, role });
      onClose();
    } catch (err) {
      const anyErr = err as any;
      const serverMsg = anyErr?.context?.error || anyErr?.context?.body?.error;
      const message =
        serverMsg ||
        (err instanceof Error ? err.message : "Could not send invitation.");
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
          <h2 className="text-xl font-semibold">Invite user</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                "admin",
                "inventory_manager",
                "ordering_manager",
                "sales_manager",
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                    role === r
                      ? "border-[var(--oe-green)] bg-[var(--oe-green)]/10"
                      : "border-black/10 hover:bg-black/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    className="accent-[var(--oe-green)]"
                    checked={role === (r as Role)}
                    onChange={() => setRole(r as Role)}
                  />
                  <span className="capitalize">
                    {(r as string).replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
              {submitting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
