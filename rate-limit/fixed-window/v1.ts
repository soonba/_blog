// redis.incr(k)                 1 올리고 올린 뒤 값 반환 (키 없으면 0에서 시작)
// redis.pexpire(k, ms)          ms 뒤 키 자동 삭제
// redis.pttl(k)                 남은 수명 ms (-1: 만료 없음, -2: 키 없음)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 2
const WINDOW_MS = 1000

// v1: 현재 시각을 받아 이번 요청을 통과시킬지 정한다. 통과면 true, 거절이면 false.
async function fixedWindow(nowMs: number): Promise<boolean> {
  const windowIndex = Math.floor(nowMs / WINDOW_MS)
  const redisKey = `${KEY}:${windowIndex}`
  const count = await redis.incr(redisKey) //원자성 보장
  if (count > LIMIT) {
    return false
  }
  return true
}

const cases: [number, boolean][] = [
  [100, true],
  [200, true],
  [300, false],
  [990, false],
  [999, false],
  [1000, true],
  [1005, true],
  [1300, false],
  [1999, false],
  [2000, true],
]

await redis.flushdb()
let fail = 0
for (const [t, expected] of cases) {
  const actual = await fixedWindow(t)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', t, '기대', expected, '실제', actual)
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
