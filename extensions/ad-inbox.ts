/**
 * ad-inbox — deliver pending agent-dispatch messages when pi settles.
 *
 * On agent_settled (about to go idle), drain `ad receive --json` and if there
 * is mail, inject it as a follow-up user message so the turn continues.
 *
 * Companion to Claude/Codex Stop hooks (`ad stop-hook --harness …`).
 */

import { spawnSync } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type AdMessage = {
	from?: string;
	sent_at?: string;
	body?: string;
};

function formatMessages(messages: AdMessage[]): string {
	const header =
		`[ad] You have ${messages.length} new agent-dispatch message(s). ` +
		"Handle them now before stopping.\n";
	const blocks = messages.map((msg, i) => {
		const fr = msg.from ?? "?";
		const sent = msg.sent_at ?? "?";
		const body = msg.body ?? "";
		return `[${i + 1}] from=${fr} at=${sent}\n${body}`;
	});
	let text = header + "\n" + blocks.join("\n\n");
	if (text.length > 9000) {
		text = text.slice(0, 8980) + "\n…(truncated)…";
	}
	return text;
}

function drainInbox(): AdMessage[] {
	const result = spawnSync("ad", ["receive", "--json"], {
		encoding: "utf8",
		env: process.env,
		timeout: 10_000,
	});
	if (result.error || result.status !== 0) {
		return [];
	}
	const raw = (result.stdout || "").trim();
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed as AdMessage[];
	} catch {
		return [];
	}
}

export default function (pi: ExtensionAPI) {
	if (process.env.HERDR_ENV !== "1") {
		return;
	}

	let rootSession = false;
	let delivering = false;

	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		if (ctx?.hasUI !== true) {
			return;
		}
		rootSession = true;
	});

	pi.on("session_shutdown", () => {
		rootSession = false;
	});

	pi.on("agent_settled", (_event, ctx: ExtensionContext) => {
		if (!rootSession) {
			return;
		}
		if (ctx?.isIdle?.() !== true) {
			return;
		}
		if (delivering) {
			return;
		}

		delivering = true;
		try {
			const messages = drainInbox();
			if (messages.length === 0) {
				return;
			}
			const text = formatMessages(messages);
			try {
				if (ctx.isIdle()) {
					pi.sendUserMessage(text);
				} else {
					pi.sendUserMessage(text, { deliverAs: "followUp" });
				}
			} catch (error) {
				console.error("ad-inbox: failed to deliver messages", error);
			}
		} finally {
			delivering = false;
		}
	});
}
