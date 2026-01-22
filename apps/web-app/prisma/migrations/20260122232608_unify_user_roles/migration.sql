-- ユーザーロールの統一: asker/responder を廃止し、user/admin のみに
-- 全ユーザーが質問も回答も可能な設計に変更

-- 1. 既存の asker/responder ユーザーを user に変更
UPDATE "users" SET "role" = 'user' WHERE "role" IN ('asker', 'responder');

-- 2. 新しいenum型を作成
CREATE TYPE "UserRole_new" AS ENUM ('user', 'admin');

-- 3. カラムの型を変更
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- 4. 古いenum型を削除して新しい型にリネーム
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- 5. ResponderProfileがないユーザーに作成（全ユーザーが回答可能にするため）
INSERT INTO "responder_profiles" ("id", "userId", "expertiseTags", "answerCount", "thanksCount", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u."id",
  ARRAY[]::text[],
  0,
  0,
  NOW(),
  NOW()
FROM "users" u
LEFT JOIN "responder_profiles" rp ON u."id" = rp."userId"
WHERE rp."id" IS NULL;
