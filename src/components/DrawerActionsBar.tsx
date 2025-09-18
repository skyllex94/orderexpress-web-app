import React from "react";

type DrawerActionsBarProps = {
  showDelete: boolean;
  deleting: boolean;
  saving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDeleteClick: () => void;
};

export default function DrawerActionsBar({
  showDelete,
  deleting,
  saving,
  canSave,
  onCancel,
  onSave,
  onDeleteClick,
}: DrawerActionsBarProps) {
  return (
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
      <div className="flex items-center">
        {showDelete ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
            onClick={onDeleteClick}
            disabled={saving || deleting}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--oe-green)]/60 ${
            !canSave
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-[var(--oe-green)] text-black hover:opacity-90"
          }`}
          disabled={!canSave}
          onClick={onSave}
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
  );
}
