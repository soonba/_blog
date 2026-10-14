// redis.zadd(k, score, member)                 추가. 같은 member면 덮어씀
// redis.zremrangebyscore(k, '-inf', max)       점수 ≤ max 전부 삭제
// redis.zcard(k)                               개수
// redis.zrange(k, 0, 0, 'WITHSCORES')          점수 가장 작은 1개 → [member, score] (문자열)

import { redis } from '../redis.ts'

const KEY = '나의몰:나의화주'
const LIMIT = 3
const WINDOW_MS = 1000

function randomId(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let id = ''
  for (let i = 0; i < 6; i++) id += letters[Math.floor(Math.random() * letters.length)]
  return id
}

// v2: 한 번에 여러 칸을 쓰는 요청이 있다 (cost). 통과면 0,
//     거절이면 이 요청이 통과할 수 있을 때까지 기다릴 ms.
async function slidingLog(nowMs: number, cost: number): Promise<number> {
  // nowMs 현재 시각 ms , cost 차지하는 개수
  // 못넣는다면, zrange로 가장 작은 cost개를 찾는다. 마지막 요소의 점수 + window를 리턴한다.

  // 현재시각 - window 의 키를 모두 없앤다.
  await redis.zremrangebyscore(KEY, '-inf', nowMs - WINDOW_MS)
  const cnt = await redis.zcard(KEY)
  if (cnt + cost > LIMIT) {
    const strings = await redis.zrange(KEY, 0, cost - 1, 'WITHSCORES')

    const lastScore = strings[strings.length - 1]
    return (+lastScore % WINDOW_MS) + WINDOW_MS - (nowMs % WINDOW_MS)
  }
  // 레디스 set에 cost 만큼 넣는다. score: 현재시각, member random uuid
  for (let index = 0; index < cost; index++) {
    await redis.zadd(KEY, nowMs, randomId())
  }
  return 0
}

const cases: [number, number, number][] = [
  [100, 1, 0],
  [200, 1, 0],
  [300, 2, 800],
  [300, 1, 0],
  [400, 1, 700],
  [400, 3, 900],
  [1150, 1, 0],
  [1250, 2, 50],
  [1300, 2, 0],
  [1400, 2, 900],
  [2200, 1, 0],
  [2250, 3, 950],
]

await redis.flushdb()
let fail = 0
for (const [t, cost, expected] of cases) {
  const actual = await slidingLog(t, cost)
  const ok = actual === expected
  if (!ok) fail++
  console.log(ok ? '✓' : '✗', t, 'cost', cost, '기대', expected, '실제', actual)
}
console.log(fail === 0 ? '통과' : `${fail}개 틀림`)
redis.disconnect()
