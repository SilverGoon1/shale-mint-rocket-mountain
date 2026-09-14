import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { BOT_PRESETS, BOT_ROLES, BOT_ROLE_LABELS, type BotRole } from "@/lib/bot/scopes";
import {
  createBotAgent,
  listBotAgents,
  listBotAudit,
  revokeBotAgent,
  rotateBotAgent,
  type BotAgentView,
  type BotAuditView,
} from "@/lib/bot/bot-admin";
import { formatShopWhen } from "@/lib/hours";
import { listDeskAccounts, setDeskAllowed } from "@/lib/shop-server";
import type { DeskAccountRow } from "@/lib/shop-types";

export const Route = createFileRoute("/admin/bots")({ component: AdminBots });

type CreateMode = "preset" | "custom";

function AdminBots() {
  const [agents, setAgents] = useState<BotAgentView[]>([]);
  const [audit, setAudit] = useState<BotAuditView[]>([]);
  const [mode, setMode] = useState<CreateMode>("preset");
  const [preset, setPreset] = useState(BOT_PRESETS[0]?.name ?? "security-guard");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState<BotRole>("ops_read");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [issued, setIssued] = useState<{ name: string; token: string } | null>(null);
  const [desk, setDesk] = useState<{
    accounts: DeskAccountRow[];
    canGrant: boolean;
    granted: number;
    max: number;
  }>({ accounts: [], canGrant: false, granted: 0, max: 12 });

  function reload() {
    void listBotAgents()
      .then(setAgents)
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load bots"));
    void listBotAudit()
      .then(setAudit)
      .catch(() => setAudit([]));
    void listDeskAccounts()
      .then(setDesk)
      .catch(() => undefined);
  }

  useEffect(() => {
    reload();
  }, []);

  function copyToken(token: string) {
    void navigator.clipboard.writeText(token).then(() => setMsg("Token copied. Store it as a bot secret — it will not be shown again."));
  }

  function onCreated(r: { agent: BotAgentView; token: string }) {
    setIssued({ name: r.agent.name, token: r.token });
    setAgents((list) => [...list.filter((a) => a.id !== r.agent.id), r.agent].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function createPreset() {
    setBusy("create");
    setMsg("");
    void createBotAgent({ data: { preset } })
      .then(onCreated)
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not create bot"))
      .finally(() => setBusy(""));
  }

  function createCustom() {
    setBusy("create");
    setMsg("");
    void createBotAgent({ data: { name: customName.trim().toLowerCase(), role: customRole } })
      .then((r) => {
        onCreated(r);
        setCustomName("");
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not create bot"))
      .finally(() => setBusy(""));
  }

  return (
    <div className="settings-page">
      <header className="page-card">
        <p className="shop-brand-kicker">Admin</p>
        <h1>Bot access</h1>
        <p className="ed-sub">
          Each bot gets its own token and the least scopes it needs. Bots never sign in as Admin. The raw token is
          shown once — copy it into the bot’s secret store, then treat it like a password. Use a preset for known
          desk roles, or Custom to mint any future agent by name and role.
        </p>
      </header>

      <section className="page-card">
        <h2>Create an agent</h2>
        <div className="seg" role="tablist" aria-label="Create mode" style={{ marginBottom: 12 }}>
          <button type="button" className="seg-btn" data-on={mode === "preset" ? "true" : "false"} onClick={() => setMode("preset")}>
            Preset
          </button>
          <button type="button" className="seg-btn" data-on={mode === "custom" ? "true" : "false"} onClick={() => setMode("custom")}>
            Custom
          </button>
        </div>

        {mode === "preset" ? (
          <div className="two-col">
            <label className="ed-field">
              <span>Preset</span>
              <select className="ed-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
                {BOT_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="ed-field">
              <span>Issue</span>
              <button type="button" className="btn-print" disabled={Boolean(busy)} onClick={createPreset}>
                {busy === "create" ? "Creating…" : "Create token"}
              </button>
            </div>
          </div>
        ) : (
          <div className="two-col">
            <label className="ed-field">
              <span>Name</span>
              <input
                className="ed-input"
                value={customName}
                placeholder="style"
                autoComplete="off"
                onChange={(e) => setCustomName(e.target.value)}
              />
              <span className="ed-sub">2–40 chars: letters, numbers, dashes</span>
            </label>
            <label className="ed-field">
              <span>Role</span>
              <select className="ed-input" value={customRole} onChange={(e) => setCustomRole(e.target.value as BotRole)}>
                {BOT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {BOT_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>
            <div className="ed-field">
              <span>Issue</span>
              <button
                type="button"
                className="btn-print"
                disabled={Boolean(busy) || customName.trim().length < 2}
                onClick={createCustom}
              >
                {busy === "create" ? "Creating…" : "Create token"}
              </button>
            </div>
          </div>
        )}
        {issued ? (
          <div className="bot-token-box">
            <p className="ed-sub">
              Token for <strong>{issued.name}</strong> — copy now. Closing this page hides it.
            </p>
            <code className="totp-secret">{issued.token}</code>
            <button type="button" className="ed-btn" onClick={() => copyToken(issued.token)}>
              <Copy size={16} />
              Copy token
            </button>
          </div>
        ) : null}
        {msg ? <p className="ed-sub">{msg}</p> : null}
      </section>

      <section className="page-card">
        <h2>Team / desk accounts</h2>
        <p className="ed-sub">
          Each bot uses its own email and password. Silver grants desk access here (soft max 14 accounts, 12 extra bots.
          Existing grants stay). A granted account opens Admin and POS — there is no Admin mode switch. Temp Admin cannot
          grant others.
        </p>
        {desk.accounts.length === 0 ? (
          <p className="ed-empty">No signed-up accounts yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Allowed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {desk.accounts.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <strong>{row.emailLocal}</strong>
                      <span className="bot-agent-state">{row.emailMasked}</span>
                      {row.displayName && row.displayName !== row.emailLocal ? (
                        <span className="bot-agent-state">{row.displayName}</span>
                      ) : null}
                    </td>
                    <td>{row.adminModeAllowed ? "Desk" : "—"}</td>
                    <td>
                      {desk.canGrant ? (
                        <button
                          type="button"
                          className={row.adminModeAllowed ? "ed-btn ed-btn-danger" : "ed-btn"}
                          disabled={Boolean(busy) || (!row.adminModeAllowed && desk.granted >= desk.max)}
                          onClick={() => {
                            setBusy(row.userId);
                            setMsg("");
                            void setDeskAllowed({ data: { userId: row.userId, allowed: !row.adminModeAllowed } })
                              .then(() => reload())
                              .catch((e) => setMsg(e instanceof Error ? e.message : "Could not update desk grant"))
                              .finally(() => setBusy(""));
                          }}
                        >
                          {row.adminModeAllowed ? "Revoke" : "Grant"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="ed-sub">
          {desk.granted}/{desk.max} granted · 14 accounts, 12 extra bots. Existing grants stay.
          {desk.canGrant ? "" : " · Ask Silver to grant your account."}
        </p>
      </section>

      <section className="page-card">
        <h2>Agents</h2>
        {agents.length === 0 ? (
          <p className="ed-empty">No bots yet. Create a Security Guard or POS token to start.</p>
        ) : (
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Scopes</th>
                  <th>Last used</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <strong>{agent.name}</strong>
                      <span className="bot-agent-state">{agent.enabled ? "Active" : "Revoked"}</span>
                    </td>
                    <td>{agent.role.replaceAll("_", " ")}</td>
                    <td>{agent.scopes.join(", ") || "—"}</td>
                    <td>{agent.lastUsedAt ? formatShopWhen(agent.lastUsedAt) : "Never"}</td>
                    <td>
                      <div className="order-actions">
                        <button
                          type="button"
                          className="ed-btn"
                          disabled={Boolean(busy)}
                          onClick={() => {
                            setBusy(agent.id);
                            setMsg("");
                            void rotateBotAgent({ data: { id: agent.id } })
                              .then((r) => {
                                setIssued({ name: r.agent.name, token: r.token });
                                setAgents((list) => list.map((a) => (a.id === r.agent.id ? r.agent : a)));
                              })
                              .catch((e) => setMsg(e instanceof Error ? e.message : "Could not rotate"))
                              .finally(() => setBusy(""));
                          }}
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className="ed-btn ed-btn-danger"
                          disabled={Boolean(busy) || !agent.enabled}
                          onClick={() => {
                            setBusy(agent.id);
                            setMsg("");
                            void revokeBotAgent({ data: { id: agent.id } })
                              .then(() => {
                                setAgents((list) => list.map((a) => (a.id === agent.id ? { ...a, enabled: false } : a)));
                                if (issued?.name === agent.name) setIssued(null);
                              })
                              .catch((e) => setMsg(e instanceof Error ? e.message : "Could not revoke"))
                              .finally(() => setBusy(""));
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <h2>Recent bot calls</h2>
        {audit.length === 0 ? (
          <p className="ed-empty">No bot traffic yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Bot</th>
                  <th>Path</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((row) => (
                  <tr key={row.id}>
                    <td>{formatShopWhen(row.createdAt)}</td>
                    <td>{row.name || "—"}</td>
                    <td>{row.path}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
