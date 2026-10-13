// redis.incr(k)                 1 올리고 올린 뒤 값 반환 (키 없으면 0에서 시작)
// redis.incrby(k, n)            n 올리고 올린 뒤 값 반환
// redis.decrby(k, n)            n 내리고 내린 뒤 값 반환
// redis.pexpire(k, ms)          ms 뒤 키 자동 삭제
// redis.pttl(k)                 남은 수명 ms (-1: 만료 없음, -2: 키 없음)
// redis.get(k)                  값 반환 (키 없으면 null, 값은 문자열)
// redis.set(k, v)               값 저장

import { redis } from '../redis.ts'

const KEY = '나의몰'
const LIMIT = 2
const WINDOW_MS = 1000

// v7: 거절된 요청은 한도를 쓰지 않는다.
async function fixedWindow(shipper: string, nowMs: number, cost: number): Promise<number> {
  if (cost > LIMIT) return -1
  const windowIndex = Math.floor(nowMs / WINDOW_MS)
  const redisKey = `${KEY}:${shipper}:${windowIndex}`
  const count = await redis.incrby(redisKey, cost) //원자성 보장, redisKey는 무조건 있음
  await redis.pexpire(redisKey, WINDOW_MS)
  if (count > LIMIT) {
    await redis.decrby(redisKey, cost)
    return (windowIndex + 1) * WINDOW_MS - nowMs
  }
  return 0
}

const cases: [string, number, number, number][] = [
  ['A', 100, 1, 0],
  ['A', 200, 2, 800],
  ['A', 300, 1, 0],
  ['A', 400, 1, 600],
  ['B', 100, 2, 0],
  ['B', 200, 1, 800],
  ['B', 300, 1, 700],
  ['D', 100, 3, -1],
]

await redis.flushdb()
let fail = 0
for (const [shipper, t, cost, expected] of cases) {
  const actual = await fixedWindow(shipper, t, cost)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', shipper, t, 'cost', cost, '기대', expected, '실제', actual)
}
const results = await Promise.all(Array.from({ length: 10 }, () => fixedWindow('C', 5000, 1)))
const passed = results.filter((r) => r === 0).length
if (passed !== LIMIT) fail++
console.log(passed === LIMIT ? '✓' : '✗', 'C 5000 동시 10개', '기대 통과', LIMIT, '실제 통과', passed)

for (const key of await redis.keys('*')) {
  const ttl = await redis.pttl(key)
  const ok = ttl > 0 && ttl <= WINDOW_MS
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', key, 'TTL', ttl)
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
