// redis.incr(k)                 1 올리고 올린 뒤 값 반환 (키 없으면 0에서 시작)
// redis.pexpire(k, ms)          ms 뒤 키 자동 삭제
// redis.pttl(k)                 남은 수명 ms (-1: 만료 없음, -2: 키 없음)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 2
const WINDOW_MS = 1000

async function fixedWindow(nowMs: number): Promise<boolean> {
  const window = Math.floor(nowMs / WINDOW_MS)

  const redisKey = `${KEY}:${window}`
  const cnt = await redis.incr(redisKey)
  await redis.pexpire(redisKey, WINDOW_MS)
  if (cnt > LIMIT) {
    return false
  }
  return true
}

await redis.flushdb()
for (const t of [995, 990, 1000, 1005, 1300]) {
  console.log(t, await fixedWindow(t))
}
redis.disconnect()
