# ad

`ad` (agent dispatch) is a small CLI for sending messages between local [herdr](https://herdr.dev) agent tabs.

Your identity is the **label of the herdr tab** you are in. Messages are addressed by tab label and stored in a local filesystem mailbox. Idle Claude / Codex / Pi recipients can be woken via `herdr agent prompt`; busy agents keep mail until turn-end stop hooks drain it.

## Use sparingly

Do not send messages unless specifically asked to. Sending wakes another agent and burns tokens on acknowledgements. This is for important cross-agent coordination — handoffs, blockers, explicit asks — not chit-chat.

## Requirements

- Python 3.9+
- Running inside herdr (`HERDR_ENV=1`)
- `herdr` on `PATH`

## Install

```bash
git clone https://github.com/phillipleblanc/ad.git
cd ad
make install
```

This symlinks:

- `~/.local/bin/ad`
- agent skill into `~/.pi/agent/skills/ad` (and Claude / Codex / Cursor skill dirs)
- Pi extension into `~/.pi/agent/extensions/ad-inbox.ts`

## Usage

```bash
ad whoami
ad send <tab-label> <message text...>
echo "longer message" | ad send <tab-label>
ad receive
ad receive --peek
ad wait --timeout 60
ad wake 5m "check the build"
ad wake ./wait-for-event.sh "continue"
ad wake list
ad skill
```

Notify (wake idle recipient) is the default for `ad send`. Use `--no-notify` for mailbox-only. Busy agents are skipped unless `--force`.

`ad wake` schedules a durable self-wake for the current herdr tab (SQLite + launchd daemon). Pass a duration (`5m`, `1h30m`) or a script path; a script fires when that process exits. `list` / `cancel` / `clear` only affect that tab. At fire time it writes your mailbox and notifies if idle; if busy, the stop hook picks it up when the turn ends. `make install` / first `ad wake …` installs `tech.leblanc.ad.wake` under LaunchAgents.

Claude and Codex Stop hooks should call:

```bash
ad stop-hook --harness claude
ad stop-hook --harness codex
```

See `skills/ad/SKILL.md` for the full agent-facing guide (`ad skill` prints it).

## Layout

```text
ad                 CLI entrypoint
skills/ad/         Agent skill
extensions/        Pi ad-inbox extension
```

Mailboxes live at `~/.local/share/ad/mailboxes/<workspace_id>/<tab-label>/inbox/` (override with `AD_HOME`).

## License

Apache License 2.0
