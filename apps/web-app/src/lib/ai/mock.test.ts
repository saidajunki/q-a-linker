/**
 * モックAIサービスのテスト
 * 仕様書: docs/specs/ai-services.md
 */

import { describe, it, expect } from 'vitest';
import { MockAIService } from './mock';

describe('MockAIService', () => {
  const service = new MockAIService();

  describe('structureQuestion', () => {
    it('質問を構造化できる', async () => {
      const result = await service.structureQuestion({
        body: 'Reactでstateが更新されないのですが、どうすればいいですか？',
      });

      expect(result.categories).toContain('プログラミング');
      expect(result.estimatedLevel).toBe('beginner');
      expect(result.intent).toBeTruthy();
      expect(result.suggestedTitle).toBeTruthy();
      expect(result.missingInfo).toBeInstanceOf(Array);
    });

    it('カテゴリが検出されない場合は「一般」を返す', async () => {
      const result = await service.structureQuestion({
        body: 'これはテストです',
      });

      expect(result.categories).toContain('一般');
    });

    it('複数のカテゴリを検出できる', async () => {
      const result = await service.structureQuestion({
        body: 'プログラマーとして転職したいのですが、面接でReactの質問をされたらどう答えればいいですか？',
      });

      expect(result.categories).toContain('プログラミング');
      expect(result.categories).toContain('キャリア');
    });

    it('長い質問のタイトルは50文字以内に切り詰める', async () => {
      const longQuestion = 'これは非常に長い質問文です。'.repeat(10);
      const result = await service.structureQuestion({ body: longQuestion });

      expect(result.suggestedTitle.length).toBeLessThanOrEqual(50);
    });
  });

  describe('simplifyAnswer', () => {
    it('回答を初心者向けに翻訳できる', async () => {
      const result = await service.simplifyAnswer({
        body: 'useStateの更新は非同期で行われます',
        targetLevel: 'beginner',
        questionContext: 'Reactのstate更新について',
      });

      expect(result.simplifiedBody).toContain('初心者向け');
      expect(result.simplifiedBody).toContain('useStateの更新は非同期で行われます');
    });

    it('中級者向けの場合はプレフィックスが異なる', async () => {
      const result = await service.simplifyAnswer({
        body: 'useStateの更新は非同期で行われます',
        targetLevel: 'intermediate',
        questionContext: 'Reactのstate更新について',
      });

      expect(result.simplifiedBody).not.toContain('初心者向け');
    });
  });

  describe('mergeAnswers', () => {
    it('複数の回答を統合できる', async () => {
      const result = await service.mergeAnswers({
        answers: [
          { id: '1', body: '回答1です', responderId: 'user1' },
          { id: '2', body: '回答2です', responderId: 'user2' },
        ],
        questionContext: 'テスト質問',
        targetLevel: 'beginner',
      });

      expect(result.body).toContain('統合回答');
      expect(result.body).toContain('回答1です');
      expect(result.body).toContain('回答2です');
      expect(result.contributions).toHaveLength(2);
      expect(result.contributions[0].answerId).toBe('1');
      expect(result.contributions[1].answerId).toBe('2');
    });

    it('構造化された統合回答を返す', async () => {
      const result = await service.mergeAnswers({
        answers: [{ id: '1', body: '回答です', responderId: 'user1' }],
        questionContext: 'テスト質問',
        targetLevel: 'beginner',
      });

      expect(result.structure).toBeDefined();
      expect(result.structure.conclusion).toBeTruthy();
      expect(result.structure.nextActions).toBeInstanceOf(Array);
    });
  });

  describe('moderate', () => {
    it('問題のないコンテンツは承認する', async () => {
      const result = await service.moderate({
        body: 'これは普通の質問です',
        type: 'question',
      });

      expect(result.isApproved).toBe(true);
      expect(result.flags).toHaveLength(0);
      expect(result.requiresReview).toBe(false);
    });

    it('メールアドレスを検出してマスキングする', async () => {
      const result = await service.moderate({
        body: '連絡先はtest@example.comです',
        type: 'question',
      });

      expect(result.isApproved).toBe(false);
      expect(result.flags).toHaveLength(1);
      expect(result.flags[0].type).toBe('pii');
      expect(result.sanitizedBody).toContain('[メールアドレス]');
      expect(result.sanitizedBody).not.toContain('test@example.com');
    });

    it('電話番号を検出してマスキングする', async () => {
      const result = await service.moderate({
        body: '電話番号は090-1234-5678です',
        type: 'answer',
      });

      expect(result.isApproved).toBe(false);
      expect(result.flags).toHaveLength(1);
      expect(result.flags[0].type).toBe('pii');
      expect(result.sanitizedBody).toContain('[電話番号]');
      expect(result.sanitizedBody).not.toContain('090-1234-5678');
    });

    it('複数のPIIを同時に検出できる', async () => {
      const result = await service.moderate({
        body: 'メールはtest@example.com、電話は03-1234-5678です',
        type: 'question',
      });

      expect(result.flags).toHaveLength(2);
      expect(result.sanitizedBody).toContain('[メールアドレス]');
      expect(result.sanitizedBody).toContain('[電話番号]');
    });
  });
});
