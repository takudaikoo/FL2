# Supabase データベースセットアップ手順

## ステップ1: SQLエディタでスキーマを実行

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクト「kbifluukpqhbjmhhvbgg」を選択

2. **SQL Editorを開く**
   - 左サイドバーから「SQL Editor」をクリック
   - 「New query」をクリック

3. **SQLを実行**
   - [database.sql](file:///c:/Projects/FL/database.sql) の内容をコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック

4. **確認**
   - 左サイドバーから「Table Editor」をクリック
   - `plans`, `items`, `attendee_options` テーブルが作成されていることを確認
   - 各テーブルにデータが入っていることを確認

## ステップ2: スタッフアカウント作成

1. **Authentication設定**
   - 左サイドバーから「Authentication」→「Users」をクリック
   - 「Add user」→「Create new user」をクリック

2. **3名のアカウントを作成**
   以下のメールアドレスで作成（パスワードは自由に設定）:
   - takudai_koo@gjb.co.jp
   - takudai.koo@gmail.com
   - kota.ooishi@gmail.com

3. **確認メール設定**
   - 「Auth」→「Email Templates」で確認メールのテンプレート確認
   - 必要に応じてカスタマイズ

---

**次のステップ**: SQLとアカウント作成が完了したら、フロントエンドの実装を続けます。

完了したら教えてください！

## トラブルシューティング

### "violates check constraint items_type_check" エラー
「自由入力」アイテムを追加する際にこのエラーが出る場合、データベースの定義が古くなっています。
SupabaseのSQL Editorで以下のSQLを実行して更新してください：

```sql
DO $$
BEGIN
    ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
    ALTER TABLE items ADD CONSTRAINT items_type_check 
    CHECK (type IN ('included', 'checkbox', 'dropdown', 'tier_dependent', 'free_input'));
END $$;
```
