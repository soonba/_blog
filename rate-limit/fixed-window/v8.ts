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

// v8: 0.9·0.95·1.05·1.1초에 4번 보낸다. "1초에 2번"이 지켜졌나?
//     고칠 문제가 아니라 보는 문제다. 고정 윈도우로는 못 막는다 → 슬라이딩 윈도우.
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

await redis.flushdb()
let passed = 0
for (const t of [900, 950, 1050, 1100]) {
  const result = await fixedWindow('A', t, 1)
  if (result === 0) passed++
  console.log(t, result === 0 ? '통과' : `거절 (${result}ms 뒤)`)
}
console.log('200ms 사이에 통과', passed, '번 / 한도', LIMIT)
redis.disconnect()
