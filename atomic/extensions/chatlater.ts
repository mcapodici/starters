import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { AutocompleteItem } from "@earendil-works/pi-tui";
import type { ExtensionAPI } from "@bastani/atomic";

interface ChatLaterItem {
  id: string;
  text: string;
  storedAt: string;
}

interface HistoryItem extends ChatLaterItem {
  discussedAt: string;
}

const QUEUE_FILE = join(homedir(), ".atomic", "chatlater-queue.json");

const SUBCOMMANDS = ["store", "list", "peek", "talk", "history", "next", "drop", "clear"];

async function loadQueue(): Promise<ChatLaterItem[]> {
  try {
    const raw = await readFile(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ChatLaterItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.storedAt === "string",
    );
  } catch {
    return [];
  }
}

async function saveQueue(items: ChatLaterItem[]): Promise<void> {
  await mkdir(join(homedir(), ".atomic"), { recursive: true });
  await writeFile(QUEUE_FILE, JSON.stringify(items, null, 2) + "\n", "utf8");
}

const HISTORY_FILE = join(homedir(), ".atomic", "chatlater-history.json");
const HISTORY_LIMIT = 50;

async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is HistoryItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.storedAt === "string",
    );
  } catch {
    return [];
  }
}

async function saveHistory(items: HistoryItem[]): Promise<void> {
  await mkdir(join(homedir(), ".atomic"), { recursive: true });
  await writeFile(HISTORY_FILE, JSON.stringify(items, null, 2) + "\n", "utf8");
}

async function recordHistory(item: ChatLaterItem): Promise<void> {
  const history = await loadHistory();
  const deduped = history.filter((h) => h.text !== item.text);
  deduped.push({ ...item, discussedAt: new Date().toISOString() });
  const trimmed = deduped.slice(Math.max(0, deduped.length - HISTORY_LIMIT));
  await saveHistory(trimmed);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown time";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function stripQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function buildKickoff(item: ChatLaterItem, remainingCount: number): string {
  const when = relativeTime(item.storedAt);
  const remaining =
    remainingCount === 0
      ? "That was the last one in the queue."
      : `${remainingCount} left in the queue.`;
  return (
    `Here's something I saved earlier to chat about (stored ${when}). ${remaining}\n\n` +
    `"${item.text}"\n\n` +
    `Let's talk about it.`
  );
}

function buildReplay(item: ChatLaterItem): string {
  const when = relativeTime(item.storedAt);
  return (
    `Let's pick this back up from my chatlater history (originally saved ${when}).\n\n` +
    `"${item.text}"\n\n` +
    `Let's talk about it.`
  );
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("chatlater", {
    description:
      "Stash a thought to chat about later. Bare /chatlater pops the oldest and starts talking about it.",
    getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
      const items = SUBCOMMANDS.map((s) => ({ value: s, label: s }));
      const filtered = items.filter((i) => i.value.startsWith(prefix.trim()));
      return filtered.length > 0 ? filtered : null;
    },
    handler: async (args, ctx) => {
      const raw = (args ?? "").trim();
      const spaceIdx = raw.indexOf(" ");
      const firstWord = (spaceIdx === -1 ? raw : raw.slice(0, spaceIdx)).toLowerCase();
      const rest = spaceIdx === -1 ? "" : raw.slice(spaceIdx + 1);

      // store / add
      if (firstWord === "store" || firstWord === "add") {
        const text = stripQuotes(rest);
        if (!text) {
          ctx.ui.notify('Nothing to store. Usage: /chatlater store "your thought"', "warning");
          return;
        }
        const queue = await loadQueue();
        queue.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text,
          storedAt: new Date().toISOString(),
        });
        await saveQueue(queue);
        ctx.ui.notify(`Stashed. #${queue.length} in your chatlater queue.`, "info");
        return;
      }

      // list
      if (firstWord === "list" || firstWord === "ls") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Chatlater queue is empty.", "info");
          return;
        }
        const lines = queue.map(
          (item, i) => `${i + 1}. ${item.text}  (${relativeTime(item.storedAt)})`,
        );
        ctx.ui.notify(`${queue.length} waiting:\n${lines.join("\n")}`, "info");
        return;
      }

      // history: browse previously discussed items and restart one
      if (firstWord === "history" || firstWord === "hist") {
        const history = await loadHistory();
        if (history.length === 0) {
          ctx.ui.notify("No chatlater history yet. Chat about a stashed item first.", "info");
          return;
        }
        const ordered = [...history].reverse();
        const options = ordered.map(
          (item, i) =>
            `${i + 1}. ${item.text}  (discussed ${relativeTime(item.discussedAt ?? item.storedAt)})`,
        );
        const choice = await ctx.ui.select("Pick a past chat to restart:", options);
        if (!choice) return;
        const idx = Number.parseInt(choice, 10) - 1;
        if (!Number.isInteger(idx) || idx < 0 || idx >= ordered.length) return;
        const picked = ordered[idx];
        await recordHistory(picked);
        pi.sendUserMessage(buildReplay(picked));
        return;
      }

      // peek (oldest, no removal)
      if (firstWord === "peek") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Chatlater queue is empty.", "info");
          return;
        }
        const oldest = queue[0];
        ctx.ui.notify(
          `Oldest (${relativeTime(oldest.storedAt)}), ${queue.length} total:\n"${oldest.text}"`,
          "info",
        );
        return;
      }

      // drop (remove oldest without discussing)
      if (firstWord === "drop") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Chatlater queue is empty.", "info");
          return;
        }
        const dropped = queue.shift()!;
        await saveQueue(queue);
        ctx.ui.notify(`Dropped: "${dropped.text}" (${queue.length} left).`, "info");
        return;
      }

      // clear everything
      if (firstWord === "clear") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Chatlater queue is already empty.", "info");
          return;
        }
        const ok = await ctx.ui.confirm(
          "Clear chatlater queue?",
          `This deletes all ${queue.length} stashed item(s).`,
        );
        if (!ok) {
          ctx.ui.notify("Kept the queue.", "info");
          return;
        }
        await saveQueue([]);
        ctx.ui.notify("Chatlater queue cleared.", "info");
        return;
      }

      // bare /chatlater (or /chatlater next): pop oldest and start talking
      if (firstWord === "" || firstWord === "next" || firstWord === "pop") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Nothing saved. Use /chatlater store \"...\" first.", "info");
          return;
        }
        const oldest = queue.shift()!;
        await saveQueue(queue);
        await recordHistory(oldest);
        pi.sendUserMessage(buildKickoff(oldest, queue.length));
        return;
      }

      // talk {N}: pop a specific item by its /chatlater list position
      if (firstWord === "talk" || firstWord === "go") {
        const queue = await loadQueue();
        if (queue.length === 0) {
          ctx.ui.notify("Chatlater queue is empty.", "info");
          return;
        }
        const n = Number.parseInt(rest.trim(), 10);
        if (!Number.isInteger(n) || n < 1 || n > queue.length) {
          ctx.ui.notify(
            `Pick a number between 1 and ${queue.length}. Run /chatlater list to see them.`,
            "warning",
          );
          return;
        }
        const [picked] = queue.splice(n - 1, 1);
        await saveQueue(queue);
        await recordHistory(picked);
        pi.sendUserMessage(buildKickoff(picked, queue.length));
        return;
      }

      ctx.ui.notify(
        `Unknown subcommand "${firstWord}". Try: store, list, peek, talk, history, next, drop, clear.`,
        "warning",
      );
    },
  });
}
