"use client";

import { ArrowRight, Eye, EyeOff, Feather, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Retire the old, browser-only accounts (including plaintext passwords).
    window.localStorage.removeItem("hibi-local-auth-users");
    window.localStorage.removeItem("hibi-local-auth-session");
    window.localStorage.removeItem("hibi-local-follows");
    if (new URLSearchParams(window.location.search).get("error") === "callback")
      setError("確認リンクが無効か期限切れです。もう一度お試しください。");
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setConfirmationPending(false);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("認証機能の接続設定がまだ完了していません。管理者にSupabaseの設定を確認してください。");
      return;
    }
    setSubmitting(true);
    const result = isSignup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message === "Invalid login credentials" ? "メールアドレスまたはパスワードが違います。" : result.error.message);
      return;
    }
    if (isSignup && !result.data.session) {
      setNotice("確認メールを送信しました。メール内のリンクを開いて登録を完了してください。");
      setConfirmationPending(true);
      return;
    }
    router.refresh();
    router.push("/");
  };

  const resendConfirmation = async () => {
    setError("");
    setNotice("");
    const supabase = getSupabaseClient();
    if (!supabase || !email.trim()) {
      setError("再送するメールアドレスを入力してください。");
      return;
    }
    setSubmitting(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSubmitting(false);
    if (resendError) {
      setError(resendError.message.toLowerCase().includes("rate limit")
        ? "送信回数の上限に達しました。しばらく待ってから再度お試しください。"
        : resendError.message);
      return;
    }
    setNotice("確認メールを再送しました。迷惑メールフォルダーもご確認ください。");
  };

  const resetPassword = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("パスワードを再設定するメールアドレスを入力してください。");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("認証機能の接続設定がまだ完了していません。");
      return;
    }
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setSubmitting(false);
    if (resetError) setError(resetError.message);
    else setNotice("パスワード再設定用のメールを送信しました。");
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link href="/" className="auth-brand"><span><Feather size={22} /></span>Hibi</Link>
        <div>
          <p className="eyebrow">A PLACE FOR YOUR DAYS</p>
          <h1>何でもない今日も、<br />いつか大切な記憶になる。</h1>
          <p>日付で綴る、あなたの公開日記。</p>
        </div>
        <blockquote>“あの日の自分に、また会える場所。”</blockquote>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <p className="eyebrow">WELCOME TO HIBI</p>
          <h2>{isSignup ? "日記をはじめる" : "おかえりなさい"}</h2>
          <p>{isSignup ? "アカウントを作って、今日を残しましょう。" : "続きを書きに、ログインしましょう。"}</p>
          <form onSubmit={submitAuth}>
            <label>メールアドレス<div className="input-with-icon"><Mail size={17} /><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" /></div></label>
            <label>パスワード<div className="input-with-icon password-input-wrap"><LockKeyhole size={17} /><input required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="6文字以上" autoComplete={isSignup ? "new-password" : "current-password"} /><button type="button" className="password-visibility-button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {!isSignup && <>
              <button type="button" className="forgot-link" onClick={() => void resetPassword()}>パスワードを忘れた方</button>
              <button type="button" className="forgot-link" disabled={submitting} onClick={() => void resendConfirmation()}>確認メールが届かない方</button>
            </>}
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
            {confirmationPending && <button type="button" className="forgot-link" disabled={submitting} onClick={() => void resendConfirmation()}>確認メールを再送する</button>}
            <button type="submit" className="primary-button auth-submit" disabled={submitting}>{submitting ? "処理中…" : isSignup ? "アカウントを作成" : "ログイン"}<ArrowRight size={17} /></button>
          </form>
          <div className="auth-divider"><span>または</span></div>
          <button className="auth-switch" onClick={() => setIsSignup(!isSignup)}>{isSignup ? "すでにアカウントをお持ちの方はログイン" : "はじめての方はアカウントを作成"}</button>
        </div>
      </section>
    </main>
  );
}
