"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return setError("認証機能の接続設定がありません。");
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return setError("再設定リンクが無効か期限切れです。ログイン画面から再度お試しください。");
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) return setError(updateError.message);
    router.replace("/");
    router.refresh();
  }

  return <main className="auth-page"><section className="auth-form-wrap"><div className="auth-form-card">
    <h1>パスワードを再設定</h1>
    <form onSubmit={updatePassword}>
      <label>新しいパスワード<input required type="password" minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <p className="auth-message auth-error" role="alert">{error}</p>}
      <button className="primary-button auth-submit" disabled={submitting}>{submitting ? "変更中…" : "パスワードを変更"}</button>
    </form>
    <Link href="/login">ログイン画面へ</Link>
  </div></section></main>;
}
