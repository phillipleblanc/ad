---
name: ad
description: "Send and receive messages between local herdr agents with the `ad` (agent dispatch) CLI. Use only when specifically asked to coordinate with another agent, or when checking/handling your own inbox. Do not send unsolicited messages."
---

# ad — agent dispatch

`ad` is a local mailbox for agents running under herdr. Your identity is the **label of the herdr tab** you are in (from `HERDR_TAB_ID`). Messages are addressed by that tab label.

Binary: `~/.local/bin/ad` (on PATH as `ad`)
Requires: running inside herdr (`HERDR_ENV=1`)

## Use sparingly

Do **not** send messages unless specifically requested to. Sending wakes the other agent and burns tokens on acknowledgements and side chatter.

This is for important cross-agent coordination only — handoffs, blockers, explicit asks — not a chit-chat protocol. Do not ping, status-ack, or "just checking in." When in doubt, do not send.

Receiving/handling mail already in your inbox is fine. Unsolicited outbound `ad send` is not.

Print this skill anytime:

```bash
ad skill
```

## Identity

```bash
ad whoami
```

Prints your tab `label`, `tab_id`, `workspace_id`, and mailbox path. Example label: `agent-message`.

Discover other agents' labels:

```bash
herdr tab list
```

Use each tab's `label` field as the recipient name.

## Send

```bash
ad send <tab-label> <message text...>
echo "longer message" | ad send <tab-label>
ad send <tab-label> --json <message...>   # machine-readable ack
```

By default, `ad send` wakes an idle recipient (`claude` / `codex` / `pi`) via `herdr agent prompt` (prefers the live agent name on herdr 0.8+, else pane id) so they run `ad receive`. It confirms the agent actually leaves `idle` (and retries `Enter` once on composer stall). Busy agents are skipped (message stays in the inbox for the stop hook) unless `--force`. Use `--no-notify` for mailbox-only. `-n` / `--notify` still work and match the default.

```bash
ad send <tab-label> "please review the failing test"          # notifies if idle
ad send <tab-label> --force "urgent: unblock me"              # even if working
ad send <tab-label> --no-notify "quiet handoff"               # mailbox only
ad send <tab-label> -n "same as default"                      # compat
```

Other harnesses (e.g. cursor) still get the mailbox write, but no prompt injection.

Examples:

```bash
ad send coord "PR #12200 compile fix is ready for review"
ad send cust-segv "Found the SIGSEGV in write path; checking retention next"
```

Recipient resolution prefers a matching label in **your current workspace**. Ambiguous labels error out.

## Receive

```bash
ad receive              # print and consume pending messages
ad receive --peek       # print without consuming
ad receive --json       # JSON array (still consumes unless --peek)
```

Human output:

```
[1] from=coord at=2026-08-05T07:36:56.735410Z
PR #12200 compile fix is ready for review
```

JSON fields include `from`, `to`, `body`, `sent_at`, plus tab/workspace ids.

## Auto-delivery on turn end

If mail arrives while you are busy (or `--no-notify` was used), harness stop hooks drain the inbox when you are about to go idle and continue the turn with those messages:

| Harness | Mechanism |
|---|---|
| Claude | `Stop` hook → `ad stop-hook --harness claude` |
| Codex | `Stop` hook → `ad stop-hook --harness codex` (trust via `/hooks` if prompted) |
| Pi | `~/.pi/agent/extensions/ad-inbox.ts` on `agent_settled` |

Messages are consumed by the hook/extension and injected as the continue prompt — you usually do not need a separate `ad receive`. Still safe to run `ad receive` manually anytime.

## Wait

Block until something arrives (then receive it):

```bash
ad wait
ad wait --timeout 60
ad wait --json --timeout 30
```

Exit code `1` if timeout with no messages.

## When to use

- Only when the user (or a coordinator) explicitly asks you to message another agent
- Important handoffs or blockers that cannot wait for a human
- Reading your own inbox (`ad receive` / stop-hook delivery)

Do **not** use `ad` for casual updates, acks, or social ping-pong. Do **not** use it to drive another pane's terminal — that is `herdr pane run` / `herdr pane send-text`.

## Storage

Mailboxes live at:

```text
~/.local/share/ad/mailboxes/<workspace_id>/<tab-label>/inbox/
```

Override root with `AD_HOME` if needed.
