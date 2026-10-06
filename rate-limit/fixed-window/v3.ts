// v3: 창이 지난 키가 Redis 에 쌓이지 않게 한다. 판정 결과는 v2 와 같아야 한다.

// redis.incr(k)                 1 올리고 올린 뒤 값 반환 (키 없으면 0에서 시작)
// redis.pexpire(k, ms)          ms 뒤 키 자동 삭제
// redis.pttl(k)                 남은 수명 ms (-1: 만료 없음, -2: 키 없음)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 2
const WINDOW_MS = 1000

async function fixedWindow(nowMs: number): Promise<number> {
  const window = Math.floor(nowMs / WINDOW_MS)

  const redisKey = `${KEY}:${window}`
  const cnt = await redis.incr(redisKey)
  if (cnt > LIMIT) {
    return window * WINDOW_MS + WINDOW_MS - nowMs
  }
  return 0
}

const cases: [number, number][] = [
  [100, 0],
  [200, 0],
  [300, 700],
  [990, 10],
  [999, 1],
  [1000, 0],
  [1005, 0],
  [1300, 700],
  [1999, 1],
  [2000, 0],
]

await redis.flushdb()
let fail = 0
for (const [t, expected] of cases) {
  const actual = await fixedWindow(t)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', t, '기대', expected, '실제', actual)
}
for (const key of await redis.keys('*')) {
  const ttl = await redis.pttl(key)
  const ok = ttl > 0 && ttl <= WINDOW_MS
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', key, 'TTL', ttl, ok ? '' : '(만료 없음 → 영원히 남는다)')
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
