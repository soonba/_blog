// redis.incr(k)                 1 올리고 올린 뒤 값 반환 (키 없으면 0에서 시작)
// redis.pexpire(k, ms)          ms 뒤 키 자동 삭제
// redis.pttl(k)                 남은 수명 ms (-1: 만료 없음, -2: 키 없음)

import { redis } from '../redis.ts'

const KEY = '나의몰'
const LIMIT = 2
const WINDOW_MS = 1000

// v4: 화주가 여럿이다. 화주 A가 한도를 다 써도 화주 B는 통과해야 한다.
async function fixedWindow(shipper: string, nowMs: number): Promise<number> {
  const windowIndex = Math.floor(nowMs / WINDOW_MS)
  const redisKey = `${KEY}:${shipper}:${windowIndex}`
  const count = await redis.incr(redisKey) //원자성 보장, redisKey는 무조건 있음
  await redis.pexpire(redisKey, WINDOW_MS)
  if (count > LIMIT) {
    return (windowIndex + 1) * WINDOW_MS - nowMs
  }
  return 0
}

const cases: [string, number, number][] = [
  ['A', 100, 0],
  ['A', 200, 0],
  ['A', 300, 700],
  ['B', 300, 0],
  ['B', 400, 0],
  ['B', 500, 500],
  ['A', 999, 1],
  ['A', 1000, 0],
  ['B', 1000, 0],
]

await redis.flushdb()
let fail = 0
for (const [shipper, t, expected] of cases) {
  const actual = await fixedWindow(shipper, t)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', shipper, t, '기대', expected, '실제', actual)
}
for (const key of await redis.keys('*')) {
  const ttl = await redis.pttl(key)
  const ok = ttl > 0 && ttl <= WINDOW_MS
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', key, 'TTL', ttl)
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
