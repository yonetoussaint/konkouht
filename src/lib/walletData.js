// ─── Wallet Data Layer ────────────────────────────────────────────────────
// Extracted from App.tsx - wallet RPCs, deposits, withdrawals, and admin PIN

import { supabase } from "./supabaseClient";

export async function withdrawFromWallet({ amount, methodLabel }) {
  const { data, error } = await supabase.rpc("withdraw_from_wallet", {
    p_amount: amount,
    p_method_label: methodLabel,
  });
  if (error) return { newBalance: null, error };
  return { newBalance: Number(data), error: null };
}

export async function debitWalletForGift({ amount, label }) {
  const { data, error } = await supabase.rpc("debit_wallet_for_gift", {
    p_amount: amount,
    p_label: label,
  });
  if (error) return { newBalance: null, error };
  return { newBalance: Number(data), error: null };
}

// ── Admin withdrawal-confirmation PIN + pending-withdrawal review ─────────
// Withdrawals now land as `status: "pending"` (see withdraw_from_wallet in
// the wallet_rpc_migration.sql update) — the balance is debited right
// away so the same funds can't be withdrawn twice, but nothing is actually
// paid out until the organizer reviews it here and confirms with a PIN
// that's stored hashed (bcrypt, via pgcrypto) server-side in
// admin_settings. The client never sees or stores the PIN itself; every
// check happens inside the SECURITY DEFINER RPCs, which also re-verify the
// caller is the organizer.
export async function adminPinExists() {
  const { data, error } = await supabase.rpc("admin_pin_exists");
  if (error) return { exists: false, error };
  return { exists: !!data, error: null };
}

export async function setAdminPin({ newPin, currentPin }) {
  const { error } = await supabase.rpc("set_admin_pin", {
    p_new_pin: newPin,
    p_current_pin: currentPin || null,
  });
  return { error };
}

export async function listPendingWithdrawals() {
  const { data, error } = await supabase.rpc("list_pending_withdrawals");
  if (error) return { withdrawals: [], error };
  return { withdrawals: data || [], error: null };
}

export async function confirmWithdrawal({ transactionId, pin }) {
  const { error } = await supabase.rpc("confirm_withdrawal", {
    p_transaction_id: transactionId,
    p_pin: pin,
  });
  return { error };
}

export async function rejectWithdrawal({ transactionId, pin, reason }) {
  const { error } = await supabase.rpc("reject_withdrawal", {
    p_transaction_id: transactionId,
    p_pin: pin,
    p_reason: reason || null,
  });
  return { error };
}