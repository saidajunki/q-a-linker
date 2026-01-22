import { test, expect, Page } from '@playwright/test';

// テスト用のユニークなメールアドレスを生成
const generateEmail = () => `test-${Date.now()}@example.com`;

// ユーザー登録とログインのヘルパー
async function registerAndLogin(page: Page, email: string, password: string, name: string) {
  await page.goto('/auth/signup');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#name', name);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/auth/dashboard', { timeout: 10000 });
}

test.describe('質問・回答フロー', () => {
  test('質問を投稿できる', async ({ page }) => {
    const email = generateEmail();
    const password = 'TestPassword123';

    // ユーザー登録
    await registerAndLogin(page, email, password, '質問者');

    // 質問投稿ページへ
    await page.goto('/auth/threads/new');
    await expect(page.locator('h1')).toContainText('質問する');

    // 質問を入力
    const questionText = 'Reactでstateが更新されないのですが、どうすればいいですか？';
    await page.fill('textarea', questionText);

    // 投稿
    await page.click('button[type="submit"]');

    // AI分析結果が表示されることを確認
    await expect(page.locator('text=質問を投稿しました')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=AIによる分析結果')).toBeVisible();

    // カテゴリが推定されていることを確認
    await expect(page.locator('text=プログラミング')).toBeVisible();

    // 質問を確認ボタンをクリック
    await page.click('text=質問を確認する');

    // スレッド詳細ページに遷移
    await expect(page.locator('text=' + questionText.slice(0, 30))).toBeVisible({ timeout: 5000 });
  });

  test('質問一覧を表示できる', async ({ page }) => {
    const email = generateEmail();
    const password = 'TestPassword123';

    // ユーザー登録
    await registerAndLogin(page, email, password, '質問者2');

    // 質問を投稿
    await page.goto('/auth/threads/new');
    await page.fill('textarea', 'テスト質問です');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=質問を投稿しました')).toBeVisible({ timeout: 10000 });

    // 質問一覧へ
    await page.goto('/auth/threads');
    await expect(page.locator('h1')).toContainText('質問一覧');

    // 投稿した質問が表示されていることを確認
    await expect(page.locator('text=テスト質問です')).toBeVisible();
  });

  test('スレッドをクローズできる', async ({ page }) => {
    const email = generateEmail();
    const password = 'TestPassword123';

    // ユーザー登録
    await registerAndLogin(page, email, password, '質問者3');

    // 質問を投稿
    await page.goto('/auth/threads/new');
    await page.fill('textarea', 'クローズテスト用の質問');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=質問を投稿しました')).toBeVisible({ timeout: 10000 });
    await page.click('text=質問を確認する');

    // クローズボタンをクリック
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=クローズする');

    // ステータスがclosedになることを確認
    await expect(page.locator('text=closed')).toBeVisible({ timeout: 5000 });
  });
});
