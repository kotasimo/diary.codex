"use client";

import { ArrowRight, Feather, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { localAuthEnabled, localSessionKey, getLocalUsers, saveLocalUsers } from "../lib/auth";
import { getSupabaseClient } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const supabase = getSupabaseClient();
    if (localAuthEnabled) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = getLocalUsers();
      if (isSignup) {
        if (users.some((user) => user.email === normalizedEmail)) {
          setError("このメールアドレスはすでに登録されています。");
          return;
        }
        saveLocalUsers([...users, { email: normalizedEmail, password, username: username.trim() }]);
      } else if (!users.some((user) => user.email === normalizedEmail && user.password === password)) {
        setError("メールアドレスまたはパスワードが違います。");
        return;
      }
      window.localStorage.setItem(localSessionKey, normalizedEmail);
      router.push("/");
      return;
    }
    if (!supabase) {
      setError("認証機能の接続設定がまだ完了していません。管理者にSupabaseの設定を確認してください。");
      return;
    }
    setSubmitting(true);
    const result = isSignup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message === "Invalid login credentials" ? "メールアドレスまたはパスワードが違います。" : result.error.message);
      return;
    }
    if (isSignup && !result.data.session) {
      setNotice("確認メールを送信しました。メール内のリンクを開いて登録を完了してください。");
      return;
    }
    router.push("/");
  };

  const resetPassword = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("パスワードを再設定するメールアドレスを入力してください。");
      return;
    }
    const supabase = getSupabaseClient();
    if (localAuthEnabled) {
      setNotice("開発環境ではパスワード再設定メールは利用せず、登録したパスワードを使います。");
      return;
    }
    if (!supabase) {
      setError("認証機能の接続設定がまだ完了していません。");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` });
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
            {isSignup && <label>ユーザー名<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="hibi_tarou" autoComplete="nickname" /></label>}
            <label>メールアドレス<div className="input-with-icon"><Mail size={17} /><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" /></div></label>
            <label>パスワード<div className="input-with-icon"><LockKeyhole size={17} /><input required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="6文字以上" autoComplete={isSignup ? "new-password" : "current-password"} /></div></label>
            {!isSignup && <button type="button" className="forgot-link" onClick={() => void resetPassword()}>パスワードを忘れた方</button>}
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
            <button type="submit" className="primary-button auth-submit" disabled={submitting}>{submitting ? "処理中…" : isSignup ? "アカウントを作成" : "ログイン"}<ArrowRight size={17} /></button>
          </form>
          <div className="auth-divider"><span>または</span></div>
          <button className="auth-switch" onClick={() => setIsSignup(!isSignup)}>{isSignup ? "すでにアカウントをお持ちの方はログイン" : "はじめての方はアカウントを作成"}</button>
        </div>
      </section>
    </main>
  );
}
