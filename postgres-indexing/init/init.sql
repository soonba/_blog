CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

DROP TABLE IF EXISTS product;

CREATE TABLE product (
  id SERIAL PRIMARY KEY,

  -- 일반 컬럼
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  is_special boolean NOT NULL,
  created_at Date,

  -- JSON / JSONB 컬럼
  attributes_json JSON,
  attributes_jsonb JSONB
);

-- 일반 컬럼 인덱스
CREATE INDEX idx_cardinality_desc ON product(code, category, is_special);
CREATE INDEX idx_cardinality_asc ON product(is_special, category, code);

-- json 표현식 인덱스
CREATE INDEX idx_code_json ON product ((attributes_json->>'code'));

-- JSONB 인덱스 (expression index) 표현식 인덱스
CREATE INDEX idx_code_jsonb ON product ((attributes_jsonb->>'code'));

-- GIN 인덱스 (전체 필드 조회 시)
CREATE INDEX idx_gin_jsonb ON product USING GIN (attributes_jsonb);
