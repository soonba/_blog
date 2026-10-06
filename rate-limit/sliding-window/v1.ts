// redis.zadd(k, score, member)                 추가. 같은 member면 덮어씀
// redis.zremrangebyscore(k, '-inf', max)       점수 ≤ max 전부 삭제
// redis.zcard(k)                               개수
// redis.zrange(k, 0, 0, 'WITHSCORES')          점수 가장 작은 1개 → [member, score] (문자열)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 2
const WINDOW_MS = 1000

async function slidingLog(nowMs: number): Promise<boolean> {
  
}

await redis.flushdb()
for (const t of [900, 950, 1050, 1100, 1950]) {
  console.log(t, await slidingLog(t))
}
redis.disconnect()
