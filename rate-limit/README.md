# rate-limit

```sh
npm install
docker compose up -d          # Redis, localhost:6390
node fixed-window/v1.ts       # 버전 파일을 바로 실행
docker compose exec redis redis-cli
```

순서: `fixed-window/` → `sliding-window/` → (토큰 버킷) → (리키 버킷).
각 디렉토리의 README 에 v1 과 다음 문제가 있다. 버전마다 파일 하나 (`v1.ts`, `v2.ts`, …).
