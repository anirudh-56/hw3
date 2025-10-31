import React, { useState } from "react";
import { signUp } from "../utils";
import "../auth.css";

type Props = { redirectTo?: string };
const SignUp: React.FC<Props> = ({ redirectTo = "/" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErr(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      setErr("Please fill in all fields.");
      return;
    }

    //TODO: Validate the matching of passwords before signing up the user
    //For valid error content,refer the corresponding test case in App.test.tsx

    setLoading(true);
    try {
      const result = await signUp(trimmedEmail, password);

      if (result instanceof Error) throw result;

      if (!result || !(result as any).uid) {
        throw new Error("Sign up failed. Try again.");
      }

      //TODO: Redirect to the expense list on successful sign up
      window.location.assign("");
    } catch (e: any) {
      const code = e?.code || "";
      const msg =
        friendlyFirebaseError(code) ??
        e?.message ??
        `Sign up failed: ${code || "unknown"}.`;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card" aria-busy={loading} data-testid="page-signup">
      <h1 className="auth-title">Create your account</h1>

      {err && (
        <div role="alert" className="auth-error" data-testid="error-box">
          {err}
        </div>
      )}

      <form onSubmit={handleSignUp} data-testid="signup-form">
        <label htmlFor="email" className="auth-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="auth-input"
          data-testid="email-input"
        />

        <label htmlFor="password" className="auth-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="auth-input"
          data-testid="password-input"
        />

        <label htmlFor="confirmPassword" className="auth-label">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="auth-input"
          data-testid="confirm-password-input"
        />

        <button
          type="submit"
          disabled={loading}
          className="auth-primary-btn"
          data-testid="submit-btn"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="auth-muted">
        Already have an account?{" "}
        <a href="/signin" data-testid="link-signin">
          Sign in
        </a>
      </p>
    </div>
  );
};

function friendlyFirebaseError(code?: string): string | null {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email.";
    case "auth/weak-password":
      return "Password is too weak.";
    default:
      return null;
  }
}

export default SignUp;
