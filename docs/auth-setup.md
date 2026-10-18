# 認証とデータの移行

開発環境・本番環境とも Supabase Auth のメール／パスワード認証を使用します。以前のローカル専用アカウントとログイン状態は、更新後にページを開いた時点でブラウザーから削除されます。旧パスワードは自動移行しないため、Supabase に新規登録してください。日記・プロフィールのローカル保存データはこのリセットでは削除しません。

1. Supabase SQL Editor で `supabase/schema.sql`、続けて `supabase/auth-migration.sql` を実行します。両方とも再実行可能です。移行SQLは既存の日記を削除せず、古い共有テーブルへのブラウザーアクセスを停止します。
2. Supabase の Authentication → URL Configuration で Site URL を `https://diary-seven-rho.vercel.app` に設定し、Redirect URLs に `https://diary-seven-rho.vercel.app/auth/callback` と `http://localhost:3000/auth/callback` を追加します。プレビュー環境を使う場合はその URL も追加してください。メール確認を有効にします。メールテンプレートは確認・再設定リンクが `redirectTo` に戻る設定にしてください。
3. Vercel の Production／Preview／Development に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定して再デプロイします。これらはブラウザー公開用の値です。`SUPABASE_SERVICE_ROLE_KEY` は Vercel の公開環境変数に入れず、管理用スクリプトを使うときだけ安全なローカル環境に設定します。
4. 新しいアカウントでログインし、日記作成・再ログイン・ログアウト・確認メール・再設定メールを確認します。

既存の日記は新アカウントに移しません。旧共有テーブルのデータは削除せず保管したまま、ブラウザーからのアクセスだけ停止します。新アカウントの日記一覧は空の状態から始まります。

CSV を新しいアカウントへ取り込む場合は `npm run import:diary -- diary.csv --user-id=対象アカウントのUUID` を使用します。これにはローカルにのみ設定した `SUPABASE_SERVICE_ROLE_KEY` が必要です。
