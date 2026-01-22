import { test, expect } from '@playwright/test';

// テスト用のユニークなメールアドレスを生成
const generateEmail = () => `test-${Date.now()}@example.com`;

test.describe('認証フロー', () => {
  test('新規登録 → ログイン → ログアウトのフロー', async ({ page }) => {
    const email = generateEmail();
    const password = 'TestPassword123';
    const name = 'テストユーザー';

    // 1. 新規登録ページへ
    await page.goto('/auth/signup');
    await expect(page.locator('p').filter({ hasText: '新規登録' })).toBeVisible();

    // 2. フォーム入力
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#name', name);

    // 3. 登録ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/dashboard', { timeout: 10000 });

    // 5. ユーザー名が表示されていることを確認
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // 6. ログアウト
    await page.click('text=ログアウト');

    // 7. トップページにリダイレクトされることを確認
    await expect(page).toHaveURL('/');

    // 8. 再度ログイン
    await page.goto('/auth/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // 9. ダッシュボードに戻ることを確認
    await expect(page).toHaveURL('/auth/dashboard', { timeout: 10000 });
  });

  test('無効な認証情報でログインできない', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認（bg-red-500/20 クラスを使用）
    await expect(page.locator('.bg-red-500\\/20')).toBeVisible({ timeout: 5000 });
  });

  test('未認証ユーザーはダッシュボードにアクセスできない', async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    // ダッシュボードにアクセス
    await page.goto('/auth/dashboard');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/login', { timeout: 10000 });
  });
});
