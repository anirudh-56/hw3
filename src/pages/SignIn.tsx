import React, { useState } from "react";
import { signIn } from "../utils";
import "../auth.css";

type Props = { redirectTo?: string };

const SignIn: React.FC<Props> = ({ redirectTo = "/" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr(null);

    if (!email || !password) {
      setErr("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);

      if (result instanceof Error) throw result;
      if (!result || !(result as any).uid) {
        throw new Error("Sign-in failed. Try again.");
      }

      //TODO: Redirect to the expense list on successful sign in
    } catch (e: any) {
      const msg =
        friendlyFirebaseError(e?.code) ||
        e?.message ||
        "Sign-in failed. Try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && email.trim() !== "" && password !== "";

  return (
    <div className="auth-card" aria-busy={loading} data-testid="page-signin">
      <h1 className="auth-title">Sign in</h1>

      {err && (
        <div
          role="alert"
          aria-live="polite"
          className="auth-error"
          data-testid="error-box"
        >
          {err}
        </div>
      )}

      <form onSubmit={handleEmailSignIn} data-testid="signin-form" noValidate>
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
          autoComplete="current-password"
          className="auth-input"
          data-testid="password-input"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="auth-primary-btn"
          data-testid="submit-btn"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-muted">
        New here?{" "}
        <a href="/signup" data-testid="link-signup">
          Create an account
        </a>
      </p>
    </div>
  );
};

function friendlyFirebaseError(code?: string): string | null {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "No account found for that email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/invalid-email":
      return "Please enter a valid email.";
    default:
      return null;
  }
}

export default SignIn;
