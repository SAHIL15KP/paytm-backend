import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";

export function Signin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/user/signin", form);
      localStorage.setItem("token", response.data.token);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to sign you in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="auth-card">
        <div className="brand-block">
          <div className="brand-mark">PF</div>
          <div>
            <p className="eyebrow">Paytm-style super app</p>
            <h1>PayFlow</h1>
          </div>
        </div>
        <div className="auth-copy">
          <h2>Sign in to your wallet, UPI, bills, travel, and activity vault.</h2>
          <p>
            This build keeps payment history, search, offers, recharge flows, and
            nanosecond-timed actions inside one responsive web dashboard.
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              className="field-input"
              type="email"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="field-input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Enter your password"
              required
            />
          </label>
          {error ? <p className="form-message error-text">{error}</p> : null}
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Open dashboard"}
          </button>
        </form>
        <p className="auth-footer">
          New here? <Link to="/signup">Create your demo account</Link>
        </p>
      </section>
    </div>
  );
}
