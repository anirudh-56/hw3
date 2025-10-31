import React, { useState } from "react";
import { signOut } from "./utils";

const LogoutButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleLogout() {
    if (loading) return;
    setErr(null);
    setLoading(true);
    try {
      await signOut();
      window.location.assign("/signin");
    } catch (e: any) {
      setErr(e?.message || "Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      aria-busy={loading}
      style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
    >
      <button
        onClick={handleLogout}
        className="btn"
        data-testid="logout"
        title="Log out"
        type="button"
        disabled={loading}
      >
        {loading ? "Logging out…" : "Logout"}
      </button>

      {err && (
        <span
          role="alert"
          aria-live="polite"
          style={{ color: "#b00020", fontSize: 12 }}
          data-testid="logout-error"
        >
          {err}
        </span>
      )}
    </div>
  );
};

export default LogoutButton;
