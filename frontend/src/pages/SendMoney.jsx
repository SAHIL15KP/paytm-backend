import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";

export function SendMoney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetName = searchParams.get("name") || "";
  const presetId = searchParams.get("id") || "";
  const [form, setForm] = useState({
    to: presetId,
    recipientName: presetName,
    recipientHandle: "",
    amount: "",
    note: "",
    source: "bank",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/account/transfer", {
        to: form.to || undefined,
        recipientName: form.recipientName || undefined,
        recipientHandle: form.recipientHandle || undefined,
        amount: form.amount,
        note: form.note || undefined,
        source: form.source,
      });
      setMessage(`${response.data.message} (${Number(response.data.latencyNs || 0).toLocaleString("en-IN")} ns)`);
      window.setTimeout(() => navigate("/dashboard"), 1200);
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
        return;
      }
      setError(getErrorMessage(requestError, "Unable to send payment."));
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
            <p className="eyebrow">Quick transfer</p>
            <h1>Send money</h1>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Recipient name</span>
            <input
              className="field-input"
              value={form.recipientName}
              onChange={(event) =>
                setForm((current) => ({ ...current, recipientName: event.target.value, to: "" }))
              }
              placeholder="Recipient name"
              required
            />
          </label>
          <label className="field">
            <span>UPI ID or handle</span>
            <input
              className="field-input"
              value={form.recipientHandle}
              onChange={(event) =>
                setForm((current) => ({ ...current, recipientHandle: event.target.value, to: "" }))
              }
              placeholder="name@pay"
            />
          </label>
          <label className="field">
            <span>Amount</span>
            <input
              className="field-input"
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              placeholder="1500"
              required
            />
          </label>
          <label className="field">
            <span>Source</span>
            <select
              className="field-input"
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({ ...current, source: event.target.value }))
              }
            >
              <option value="bank">Linked bank</option>
              <option value="wallet">Wallet</option>
              <option value="upiLite">UPI Lite</option>
            </select>
          </label>
          <label className="field">
            <span>Note</span>
            <input
              className="field-input"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Optional note"
            />
          </label>
          {message ? <p className="form-message success-text">{message}</p> : null}
          {error ? <p className="form-message error-text">{error}</p> : null}
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send payment"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </section>
    </div>
  );
}
