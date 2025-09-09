import Users from "./settings/Users";
import Billing from "./settings/Billing";
import AccountSettings from "./settings/Account";

export default function Settings({
  businessId,
  section,
}: {
  businessId: string;
  section: "plan" | "users" | "account" | null;
}) {
  return (
    <div className="space-y-6">
      {section === "users" && <Users businessId={businessId} />}
      {section === "plan" && <Billing />}
      {section === "account" && <AccountSettings />}
      {!section && (
        <p className="text-gray-600">
          Choose a settings section from the sidebar.
        </p>
      )}
    </div>
  );
}
