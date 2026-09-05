import type { Transaction } from "./types";

export function txReference(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `TXN-${code}`;
}

export function splitLabelNote(label: string): { main: string; note: string | null } {
  const match = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(label || "");
  if (!match) return { main: label, note: null };
  return { main: match[1], note: match[2] };
}

export function extractCompetitionTitle(mainLabel: string): string | null {
  const m = /^(?:Inscription|Réduction early bird|Remboursement)\s*—\s*(.+)$/.exec(mainLabel || "");
  return m ? m[1].trim() : null;
}

export function dedupeTransactions(list: Transaction[]): Transaction[] {
  const seen = new Set();
  const result: Transaction[] = [];
  for (const tx of list) {
    const key = [tx.type, tx.label, tx.amount, tx.rawDate || tx.date].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tx);
  }
  return result;
}

export function groupTransactionsByDay(list: Transaction[]): { day: string; items: Transaction[] }[] {
  const groups: { day: string; items: Transaction[] }[] = [];
  const map = new Map<string, { day: string; items: Transaction[] }>();
  for (const tx of list) {
    const day = tx.date.includes(",") ? tx.date.split(",")[0].trim() : tx.date;
    if (!map.has(day)) {
      const group = { day, items: [] };
      map.set(day, group);
      groups.push(group);
    }
    map.get(day)!.items.push(tx);
  }
  return groups;
}