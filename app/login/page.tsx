"use client";

import { ArrowRight, Feather, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);

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
          {isSignup && <label>ユーザー名<input placeholder="hibi_tarou" /></label>}
          <label>メールアドレス<div className="input-with-icon"><Mail size={17} /><input type="email" placeholder="you@example.com" /></div></label>
          <label>パスワード<div className="input-with-icon"><LockKeyhole size={17} /><input type="password" placeholder="8文字以上" /></div></label>
          {!isSignup && <button className="forgot-link">パスワードを忘れた方</button>}
          <Link href="/" className="primary-button auth-submit">{isSignup ? "アカウントを作成" : "ログイン"}<ArrowRight size={17} /></Link>
          <div className="auth-divider"><span>または</span></div>
          <button className="auth-switch" onClick={() => setIsSignup(!isSignup)}>{isSignup ? "すでにアカウントをお持ちの方はログイン" : "はじめての方はアカウントを作成"}</button>
        </div>
      </section>
    </main>
  );
}
