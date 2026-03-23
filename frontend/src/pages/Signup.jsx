import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";

export function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    city: "New Delhi",
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
      const response = await api.post("/user/signup", form);
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="auth-card auth-card-wide">
        <div className="brand-block">
          <div className="brand-mark">PF</div>
          <div>
            <p className="eyebrow">Paytm-inspired onboarding</p>
            <h1>Launch your PayFlow account</h1>
          </div>
        </div>
        <div className="auth-copy">
          <h2>Get wallet balance, UPI Lite, offers, recharges, travel cards, and stored payment data from the start.</h2>
          <p>
            A starter cashback reward and a personalized UPI ID are provisioned
            during signup so the dashboard feels alive immediately.
          </p>
        </div>
        <form className="auth-form auth-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>First name</span>
            <input
              className="field-input"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
              placeholder="Aarav"
              required
            />
          </label>
          <label className="field">
            <span>Last name</span>
            <input
              className="field-input"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
              placeholder="Mehra"
              required
            />
          </label>
          <label className="field">
            <span>Mobile</span>
            <input
              className="field-input"
              value={form.mobileNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, mobileNumber: event.target.value }))
              }
              placeholder="9876543210"
              required
            />
          </label>
          <label className="field">
            <span>City</span>
            <input
              className="field-input"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              placeholder="New Delhi"
              required
            />
          </label>
          <label className="field auth-grid-span">
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
          <label className="field auth-grid-span">
            <span>Password</span>
            <input
              className="field-input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Minimum 6 characters"
              required
            />
          </label>
          {error ? <p className="form-message error-text auth-grid-span">{error}</p> : null}
          <button className="primary-button auth-submit auth-grid-span" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create super app account"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/signin">Sign in instead</Link>
        </p>
      </section>
    </div>
  );
}
