import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAIService, getAIService } from './index';
import { MockAIService } from './mock';

describe('AI Service Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAIService', () => {
    it('mockプロバイダーでMockAIServiceを返す', () => {
      const service = createAIService('mock');
      expect(service).toBeInstanceOf(MockAIService);
    });

    it('openaiプロバイダーでMockAIServiceにフォールバックする', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const service = createAIService('openai');
      expect(service).toBeInstanceOf(MockAIService);
      expect(consoleSpy).toHaveBeenCalledWith('OpenAI provider not implemented, falling back to mock');
      consoleSpy.mockRestore();
    });

    it('claudeプロバイダーでMockAIServiceにフォールバックする', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const service = createAIService('claude');
      expect(service).toBeInstanceOf(MockAIService);
      expect(consoleSpy).toHaveBeenCalledWith('Claude provider not implemented, falling back to mock');
      consoleSpy.mockRestore();
    });

    it('不明なプロバイダーでMockAIServiceにフォールバックする', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error - テスト用に不正な値を渡す
      const service = createAIService('unknown');
      expect(service).toBeInstanceOf(MockAIService);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown AI provider: unknown, falling back to mock');
      consoleSpy.mockRestore();
    });

    it('環境変数からプロバイダーを読み取る', () => {
      process.env.AI_PROVIDER = 'mock';
      const service = createAIService();
      expect(service).toBeInstanceOf(MockAIService);
    });

    it('環境変数が未設定の場合はmockを使用する', () => {
      delete process.env.AI_PROVIDER;
      const service = createAIService();
      expect(service).toBeInstanceOf(MockAIService);
    });
  });

  describe('getAIService', () => {
    it('AIサービスのインスタンスを返す', () => {
      const service = getAIService();
      expect(service).toBeInstanceOf(MockAIService);
    });

    it('シングルトンインスタンスを返す', () => {
      const service1 = getAIService();
      const service2 = getAIService();
      expect(service1).toBe(service2);
    });
  });
});
