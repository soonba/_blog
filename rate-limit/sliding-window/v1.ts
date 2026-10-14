// redis.zadd(k, score, member)                 추가. 같은 member면 덮어씀
// redis.zremrangebyscore(k, '-inf', max)       점수 ≤ max 전부 삭제
// redis.zcard(k)                               개수
// redis.zrange(k, 0, 0, 'WITHSCORES')          점수 가장 작은 1개 → [member, score] (문자열)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 2
const WINDOW_MS = 1000

// v1: 지금부터 거꾸로 1초 안에 통과한 요청 수로 판정한다. 통과면 true, 거절이면 false.
async function slidingLog(nowMs: number): Promise<boolean> {
  await redis.zremrangebyscore(KEY, '-inf', nowMs - WINDOW_MS)
  const cnt = await redis.zcard(KEY)
  if (cnt >= LIMIT) {
    return false
  }
  await redis.zadd(KEY, nowMs, nowMs)
  return true
}

const cases: [number, boolean][] = [
  [900, true],
  [950, true],
  [1050, false],
  [1100, false],
  [1899, false],
  [1900, true],
  [1950, true],
  [1960, false],
]

await redis.flushdb()
let fail = 0
for (const [t, expected] of cases) {
  const actual = await slidingLog(t)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', t, '기대', expected, '실제', actual)
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
