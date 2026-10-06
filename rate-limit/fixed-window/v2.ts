// v2: 거절이면 false 대신 "몇 ms 뒤에 다시 와라"를 돌려준다. 통과면 0.

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
  await redis.pexpire(redisKey, WINDOW_MS)
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
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
