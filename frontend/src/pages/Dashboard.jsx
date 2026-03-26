import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => money.format(Number(value || 0));
const formatNano = (value) =>
  value ? `${Number(value).toLocaleString("en-IN")} ns` : "Timer armed";
const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const flattenFeatures = (sections = []) =>
  sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionTitle: section.title }))
  );

function exportCsv(activities = []) {
  const rows = [
    ["Title", "Category", "Direction", "Amount", "Source", "Reference", "LatencyNs", "CreatedAt"],
    ...activities.map((activity) => [
      activity.title,
      activity.category,
      activity.direction,
      activity.amount,
      activity.source,
      activity.reference,
      activity.latencyNs || 0,
      activity.createdAt,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "payflow-activity.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function jumpTo(panelId) {
  document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [searchResults, setSearchResults] = useState({
    contacts: [],
    services: [],
    offers: [],
    activities: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [busy, setBusy] = useState({
    transfer: false,
    service: false,
    topup: false,
    activityId: "",
  });
  const [transfer, setTransfer] = useState({
    to: "",
    recipientName: "",
    recipientHandle: "",
    amount: "",
    note: "",
    source: "bank",
  });
  const [service, setService] = useState({
    featureKey: "mobile-recharge",
    provider: "",
    accountRef: "",
    amount: "",
    note: "",
    source: "wallet",
  });
  const [topup, setTopup] = useState({ amount: "750", destination: "wallet" });

  const allFeatures = flattenFeatures(dashboard?.featureSections);
  const serviceFeatures = allFeatures.filter((item) => item.action === "service");
  const selectedFeature =
    serviceFeatures.find((item) => item.key === service.featureKey) || serviceFeatures[0];

  function showBanner(tone, text) {
    setBanner({ tone, text });
  }

  function handleUnauthorized(requestError) {
    if (requestError?.response?.status === 403) {
      localStorage.removeItem("token");
      navigate("/signin", { replace: true });
      return true;
    }
    return false;
  }

  async function loadDashboard(isRefresh = false) {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const response = await api.get("/account/bootstrap");
      startTransition(() => {
        setDashboard(response.data);
        setError("");
        if (response.data.contacts?.length && !transfer.to && !transfer.recipientName) {
          const first = response.data.contacts[0];
          setTransfer((current) => ({
            ...current,
            to: first.id,
            recipientName: `${first.firstName} ${first.lastName}`.trim(),
            recipientHandle: first.upiId,
          }));
        }
        if (!service.featureKey) {
          const firstService = flattenFeatures(response.data.featureSections).find(
            (item) => item.action === "service"
          );
          setService((current) => ({
            ...current,
            featureKey: firstService?.key || current.featureKey,
          }));
        }
      });
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        setError(getErrorMessage(requestError, "Unable to load dashboard."));
      }
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setBanner(null), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [banner]);

  useEffect(() => {
    if (deferredSearch.trim().length < 2) {
      setSearchOpen(false);
      setSearchResults({ contacts: [], services: [], offers: [], activities: [] });
      return undefined;
    }

    let active = true;
    api
      .get("/account/search", { params: { q: deferredSearch } })
      .then((response) => {
        if (active) {
          setSearchResults(response.data);
          setSearchOpen(true);
        }
      })
      .catch((requestError) => {
        if (!handleUnauthorized(requestError) && active) {
          showBanner("error", getErrorMessage(requestError, "Search unavailable."));
        }
      });

    return () => {
      active = false;
    };
  }, [deferredSearch]);

  async function submitTransfer(event) {
    event.preventDefault();
    setBusy((current) => ({ ...current, transfer: true }));
    try {
      const response = await api.post("/account/transfer", {
        to: transfer.to || undefined,
        recipientName: transfer.recipientName || undefined,
        recipientHandle: transfer.recipientHandle || undefined,
        amount: transfer.amount,
        note: transfer.note || undefined,
        source: transfer.source,
      });
      setTransfer((current) => ({ ...current, amount: "", note: "" }));
      showBanner("success", `${response.data.message} ${formatNano(response.data.latencyNs)}`);
      await loadDashboard(true);
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        showBanner("error", getErrorMessage(requestError, "Transfer failed."));
      }
    } finally {
      setBusy((current) => ({ ...current, transfer: false }));
    }
  }

  async function submitService(event) {
    event.preventDefault();
    setBusy((current) => ({ ...current, service: true }));
    try {
      const response = await api.post("/account/service-payment", {
        featureKey: service.featureKey,
        provider: service.provider || undefined,
        accountRef: service.accountRef || undefined,
        amount: service.amount || selectedFeature?.defaultAmount,
        note: service.note || undefined,
        source: service.source,
      });
      setService((current) => ({ ...current, amount: "", accountRef: "", note: "" }));
      const rewardText = response.data.cashback
        ? ` Cashback ${formatCurrency(response.data.cashback)}.`
        : "";
      showBanner("success", `${response.data.message}${rewardText} ${formatNano(response.data.latencyNs)}`);
      await loadDashboard(true);
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        showBanner("error", getErrorMessage(requestError, "Payment failed."));
      }
    } finally {
      setBusy((current) => ({ ...current, service: false }));
    }
  }

  async function submitTopup(event) {
    event.preventDefault();
    setBusy((current) => ({ ...current, topup: true }));
    try {
      const response = await api.post("/account/topup", topup);
      setTopup((current) => ({ ...current, amount: "" }));
      showBanner("success", `${response.data.message} ${formatNano(response.data.latencyNs)}`);
      await loadDashboard(true);
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        showBanner("error", getErrorMessage(requestError, "Unable to add money."));
      }
    } finally {
      setBusy((current) => ({ ...current, topup: false }));
    }
  }

  async function toggleVisibility(activity) {
    setBusy((current) => ({ ...current, activityId: activity.id }));
    try {
      const response = await api.patch(`/account/activity/${activity.id}/visibility`, {
        hidden: !activity.hidden,
      });
      showBanner("info", response.data.message);
      await loadDashboard(true);
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        showBanner("error", getErrorMessage(requestError, "Unable to update visibility."));
      }
    } finally {
      setBusy((current) => ({ ...current, activityId: "" }));
    }
  }

  function signOut() {
    localStorage.removeItem("token");
    navigate("/signin", { replace: true });
  }

  function chooseContact(contact) {
    setTransfer((current) => ({
      ...current,
      to: contact.id,
      recipientName: `${contact.firstName} ${contact.lastName}`.trim(),
      recipientHandle: contact.upiId,
    }));
    setSearchOpen(false);
    jumpTo("transfer-panel");
  }

  function chooseFeature(feature) {
    if (feature.action === "transfer" || feature.key === "send-money") {
      setSearchOpen(false);
      jumpTo("transfer-panel");
      return;
    }
    if (feature.action === "topup" || feature.key === "self-transfer") {
      setSearchOpen(false);
      jumpTo("topup-panel");
      return;
    }
    setService((current) => ({
      ...current,
      featureKey: feature.key,
      provider: "",
      accountRef: "",
      amount: feature.defaultAmount ? String(feature.defaultAmount) : "",
      note: "",
    }));
    setSearchOpen(false);
    jumpTo("service-panel");
  }

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="loading-card panel">
          <div className="brand-block">
            <div className="brand-mark">PF</div>
            <div>
              <p className="eyebrow">PayFlow</p>
              <h1>Loading your super app</h1>
            </div>
          </div>
          <p>Wallets, UPI rails, offers, recharge catalog, and stored activity are syncing.</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="loading-shell">
        <div className="loading-card panel">
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={() => loadDashboard()}>
              Retry
            </button>
            <button className="ghost-button" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const spendTarget = Math.min(
    (dashboard.analytics.monthlySpend / dashboard.account.monthlySpendTarget) * 100,
    100
  );

  return (
    <div className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <header className="topbar panel">
        <div className="brand-block">
          <div className="brand-mark">PF</div>
          <div>
            <p className="eyebrow">Paytm-style super app build</p>
            <h1>PayFlow Dashboard</h1>
          </div>
        </div>
        <div className="search-wrap">
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => deferredSearch.trim().length >= 2 && setSearchOpen(true)}
            placeholder="Search people, bills, travel, gold, offers..."
          />
          {searchOpen ? (
            <div className="search-popover">
              {searchResults.contacts.length ? (
                <div className="search-group">
                  <p>Contacts</p>
                  {searchResults.contacts.map((contact) => (
                    <button
                      key={contact.id}
                      className="search-item"
                      type="button"
                      onClick={() => chooseContact(contact)}
                    >
                      <strong>{`${contact.firstName} ${contact.lastName}`.trim()}</strong>
                      <span>{contact.upiId}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {searchResults.services.length ? (
                <div className="search-group">
                  <p>Services</p>
                  {searchResults.services.map((feature) => (
                    <button
                      key={feature.key}
                      className="search-item"
                      type="button"
                      onClick={() => chooseFeature(feature)}
                    >
                      <strong>{feature.title}</strong>
                      <span>{feature.subtitle}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {searchResults.offers.length ? (
                <div className="search-group">
                  <p>Offers</p>
                  {searchResults.offers.map((offer) => (
                    <div key={offer.id} className="search-item static-item">
                      <strong>{offer.title}</strong>
                      <span>{offer.description}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {!searchResults.contacts.length &&
                !searchResults.services.length &&
                !searchResults.offers.length &&
                !searchResults.activities.length ? (
                <div className="search-empty">No matches yet. Try a service, offer, or UPI contact.</div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={() => exportCsv(dashboard.activities)}>
            Export CSV
          </button>
          <button className="ghost-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {banner ? <div className={`status-banner ${banner.tone}`}>{banner.text}</div> : null}

      <main className="dashboard-grid">
        <section className="panel hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Unified money surface</p>
            <h2>{dashboard.profile.firstName}, your tracked balance is {formatCurrency(dashboard.account.totalBalance)}.</h2>
            <p>
              UPI ID <strong>{dashboard.profile.upiId}</strong>. Payments are persisted with
              references, search, export, hide and unhide controls, and nanosecond timing metadata.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => jumpTo("transfer-panel")}>
                Pay anyone
              </button>
              <button className="ghost-button" type="button" onClick={() => jumpTo("service-panel")}>
                Pay services
              </button>
            </div>
          </div>
          <div className="hero-side">
            <div className="identity-tile">
              <div className="identity-avatar">{dashboard.profile.initials}</div>
              <div>
                <p>{`${dashboard.profile.firstName} ${dashboard.profile.lastName}`}</p>
                <span>{dashboard.profile.city}</span>
              </div>
            </div>
            <div className="progress-stack">
              <div className="progress-line"><span style={{ width: `${spendTarget}%` }} /></div>
              <p>
                Monthly spend {formatCurrency(dashboard.analytics.monthlySpend)} of{" "}
                {formatCurrency(dashboard.account.monthlySpendTarget)}
              </p>
            </div>
            <div className="hero-pills">
              <span className="pill">Fastest rail {formatNano(dashboard.analytics.fastestLatencyNs)}</span>
              <span className="pill">{dashboard.analytics.hiddenCount} hidden payments</span>
              <span className="pill">{dashboard.analytics.totalTransactions} tracked transactions</span>
            </div>
          </div>
        </section>

        <section className="panel stats-panel">
          {[
            ["Wallet", formatCurrency(dashboard.account.walletBalance), "Instant spend balance"],
            ["Linked Bank", formatCurrency(dashboard.account.bankBalance), "Primary UPI source"],
            ["UPI Lite", formatCurrency(dashboard.account.upiLiteBalance), "Small-ticket quick lane"],
            ["Postpaid Available", formatCurrency(dashboard.account.postpaidAvailable), `Used ${formatCurrency(dashboard.account.postpaidUsed)}`],
            ["Cashback Earned", formatCurrency(dashboard.account.cashbackEarned), "Wallet credits from offers"],
            ["Reward Points", dashboard.account.rewardPoints.toLocaleString("en-IN"), "Across services"],
          ].map(([label, value, detail]) => (
            <article key={label} className="metric-card">
              <p>{label}</p>
              <h3>{value}</h3>
              <span>{detail}</span>
            </article>
          ))}
        </section>

        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h3>Daily Paytm-like flows</h3>
            </div>
          </div>
          <div className="quick-grid">
            {dashboard.quickActions.map((action) => (
              <button key={action.key} className="quick-action-card" type="button" onClick={() => chooseFeature(action)}>
                <span>{action.badge}</span>
                <strong>{action.title}</strong>
                <p>{action.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel transfer-panel" id="transfer-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">UPI composer</p>
              <h3>Send money to a contact or any handle</h3>
            </div>
          </div>
          <div className="chip-row">
            {dashboard.contacts.map((contact) => (
              <button key={contact.id} className={`contact-chip ${transfer.to === contact.id ? "active" : ""}`} type="button" onClick={() => chooseContact(contact)}>
                <span>{contact.initials}</span>
                <strong>{contact.firstName}</strong>
              </button>
            ))}
          </div>
          <form className="form-grid" onSubmit={submitTransfer}>
            <label className="field">
              <span>Recipient name</span>
              <input className="field-input" value={transfer.recipientName} onChange={(event) => setTransfer((current) => ({ ...current, to: "", recipientName: event.target.value }))} placeholder="Rhea Sharma" required />
            </label>
            <label className="field">
              <span>UPI ID or handle</span>
              <input className="field-input" value={transfer.recipientHandle} onChange={(event) => setTransfer((current) => ({ ...current, to: "", recipientHandle: event.target.value }))} placeholder="rhea@pay" />
            </label>
            <label className="field">
              <span>Amount</span>
              <input className="field-input" type="number" min="1" step="1" value={transfer.amount} onChange={(event) => setTransfer((current) => ({ ...current, amount: event.target.value }))} placeholder="2500" required />
            </label>
            <label className="field">
              <span>Source</span>
              <select className="field-input" value={transfer.source} onChange={(event) => setTransfer((current) => ({ ...current, source: event.target.value }))}>
                <option value="bank">Linked bank</option>
                <option value="wallet">Wallet</option>
                <option value="upiLite">UPI Lite</option>
              </select>
            </label>
            <label className="field field-span">
              <span>Note</span>
              <input className="field-input" value={transfer.note} onChange={(event) => setTransfer((current) => ({ ...current, note: event.target.value }))} placeholder="Rent, lunch, gift, or invoice" />
            </label>
            <button className="primary-button form-submit field-span" type="submit" disabled={busy.transfer}>
              {busy.transfer ? "Sending..." : "Send payment"}
            </button>
          </form>
        </section>

        <section className="panel service-panel" id="service-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recharge and services</p>
              <h3>Mobile, bills, travel, merchant QR, and digital gold</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={submitService}>
            <label className="field field-span">
              <span>Feature</span>
              <select className="field-input" value={service.featureKey} onChange={(event) => {
                const nextFeature = serviceFeatures.find((item) => item.key === event.target.value);
                setService((current) => ({ ...current, featureKey: event.target.value, provider: "", accountRef: "", amount: nextFeature?.defaultAmount ? String(nextFeature.defaultAmount) : "", note: "" }));
              }}>
                {serviceFeatures.map((feature) => (
                  <option key={feature.key} value={feature.key}>
                    {feature.title} / {feature.sectionTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Provider or merchant</span>
              <input className="field-input" value={service.provider} onChange={(event) => setService((current) => ({ ...current, provider: event.target.value }))} placeholder={selectedFeature?.title || "Provider"} />
            </label>
            <label className="field">
              <span>{selectedFeature?.promptLabel || "Reference"}</span>
              <input className="field-input" value={service.accountRef} onChange={(event) => setService((current) => ({ ...current, accountRef: event.target.value }))} placeholder={selectedFeature?.placeholder || "Reference ID"} />
            </label>
            <label className="field">
              <span>Amount</span>
              <input className="field-input" type="number" min="1" step="1" value={service.amount} onChange={(event) => setService((current) => ({ ...current, amount: event.target.value }))} placeholder={selectedFeature?.defaultAmount ? String(selectedFeature.defaultAmount) : "499"} required />
            </label>
            <label className="field">
              <span>Source</span>
              <select className="field-input" value={service.source} onChange={(event) => setService((current) => ({ ...current, source: event.target.value }))}>
                <option value="wallet">Wallet</option>
                <option value="bank">Linked bank</option>
                <option value="upiLite">UPI Lite</option>
                <option value="postpaid">Postpaid</option>
              </select>
            </label>
            <label className="field field-span">
              <span>Note</span>
              <input className="field-input" value={service.note} onChange={(event) => setService((current) => ({ ...current, note: event.target.value }))} placeholder={`${selectedFeature?.badge || "Service"} checkout note`} />
            </label>
            <button className="primary-button form-submit field-span" type="submit" disabled={busy.service}>
              {busy.service ? "Processing..." : `Pay with ${selectedFeature?.title || "service"}`}
            </button>
          </form>
        </section>

        <section className="panel topup-panel" id="topup-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Balance management</p>
              <h3>Add money and keep fast lanes funded</h3>
            </div>
          </div>
          <form className="stack-form" onSubmit={submitTopup}>
            <label className="field">
              <span>Destination</span>
              <select className="field-input" value={topup.destination} onChange={(event) => setTopup((current) => ({ ...current, destination: event.target.value }))}>
                <option value="wallet">Wallet</option>
                <option value="upiLite">UPI Lite</option>
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input className="field-input" type="number" min="1" step="1" value={topup.amount} onChange={(event) => setTopup((current) => ({ ...current, amount: event.target.value }))} placeholder="750" required />
            </label>
            <button className="primary-button" type="submit" disabled={busy.topup}>
              {busy.topup ? "Adding..." : "Add money"}
            </button>
          </form>
          <div className="offer-stack">
            {dashboard.offers.map((offer) => (
              <article key={offer.id} className="offer-card">
                <span>{offer.tag}</span>
                <h4>{offer.title}</h4>
                <p>{offer.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel catalog-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Feature map</p>
              <h3>Coverage modeled on current Paytm categories</h3>
            </div>
          </div>
          {dashboard.featureSections.map((section) => (
            <div key={section.id} className="feature-section">
              <div className="feature-section-head">
                <h4>{section.title}</h4>
                <p>{section.blurb}</p>
              </div>
              <div className="feature-grid">
                {section.items.map((item) => (
                  <button key={item.key} className="feature-card" type="button" onClick={() => chooseFeature(item)}>
                    <span>{item.badge}</span>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                    <em>{item.actionable ? "Use now" : "Explore module"}</em>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="panel discover-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Discover</p>
              <h3>Travel, wealth, credit, and business shelves</h3>
            </div>
          </div>
          <div className="discover-grid">
            {[["Travel deals", dashboard.travelDeals], ["Wealth shelf", dashboard.wealthSnapshot], ["Credit surfaces", dashboard.creditProducts], ["Business tools", dashboard.businessTools]].map(([title, items]) => (
              <div key={title} className="subpanel">
                <h4>{title}</h4>
                {items.map((item) => (
                  <article key={item.id} className="mini-card">
                    <strong>{item.title || item.route}</strong>
                    <span>{item.fare || item.value || ""}</span>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel insights-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Insights</p>
              <h3>Spend analytics and velocity</h3>
            </div>
          </div>
          <div className="insight-metrics">
            {[
              ["This month", formatCurrency(dashboard.analytics.monthlySpend), "Total outgoing payments"],
              ["Incoming", formatCurrency(dashboard.analytics.monthlyReceived), "Cashback and incoming receipts"],
              ["Avg. ticket", formatCurrency(dashboard.analytics.averageTicketSize), "Average completed debit"],
            ].map(([label, value, detail]) => (
              <article key={label} className="metric-card">
                <p>{label}</p>
                <h3>{value}</h3>
                <span>{detail}</span>
              </article>
            ))}
          </div>
          <div className="chart-strip">
            {dashboard.analytics.weeklySpend.map((day) => {
              const highest = Math.max(...dashboard.analytics.weeklySpend.map((entry) => entry.amount), 1);
              const height = Math.max((day.amount / highest) * 100, day.amount ? 18 : 8);
              return (
                <div key={day.label} className="bar-col">
                  <span className="bar" style={{ height: `${height}%` }} />
                  <strong>{day.label}</strong>
                  <p>{formatCurrency(day.amount)}</p>
                </div>
              );
            })}
          </div>
          <div className="category-list">
            {dashboard.analytics.topCategories.length ? (
              dashboard.analytics.topCategories.map((category) => (
                <article key={category.category} className="category-row">
                  <div>
                    <strong>{category.label}</strong>
                    <p>{Math.round(category.share * 100)}% of monthly spend</p>
                  </div>
                  <span>{formatCurrency(category.spent)}</span>
                </article>
              ))
            ) : (
              <p className="muted-copy">Make a few payments to unlock category analytics.</p>
            )}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payment vault</p>
              <h3>Stored activity, references, and hide or unhide controls</h3>
            </div>
          </div>
          <div className="activity-list">
            {dashboard.activities.length ? (
              dashboard.activities.map((activity) => (
                <article key={activity.id} className={`activity-row ${activity.hidden ? "is-hidden" : ""}`}>
                  <div className="activity-badge">{activity.category.slice(0, 2).toUpperCase()}</div>
                  <div className="activity-copy">
                    <div className="activity-title-line">
                      <h4>{activity.title}</h4>
                      <span className="activity-source">{activity.source}</span>
                    </div>
                    <p>{activity.subtitle || activity.counterparty || activity.reference}</p>
                    <div className="activity-meta">
                      <span>{formatDate(activity.createdAt)}</span>
                      <span>{formatNano(activity.latencyNs)}</span>
                      <span>{activity.reference}</span>
                    </div>
                  </div>
                  <div className="activity-side">
                    <strong className={activity.direction === "credit" ? "credit" : "debit"}>
                      {activity.direction === "credit" ? "+" : activity.direction === "debit" ? "-" : ""}
                      {formatCurrency(activity.amount)}
                    </strong>
                    <button className="mini-button" type="button" disabled={busy.activityId === activity.id} onClick={() => toggleVisibility(activity)}>
                      {busy.activityId === activity.id ? "Saving..." : activity.hidden ? "Unhide" : "Hide"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-copy">No payments yet. Start with a transfer, recharge, or travel booking.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
