export function decodeSnowflake(
  id: string,
  epoch: number = 1420070400000,
): { timestamp: Date; worker: number; process: number; increment: number } {
  try {
    const big = BigInt(id);
    const ts = Number(big >> 22n) + epoch;
    const worker = Number((big & 0x3e0000n) >> 17n);
    const process = Number((big & 0x1f000n) >> 12n);
    const increment = Number(big & 0xfffn);
    return { timestamp: new Date(ts), worker, process, increment };
  } catch {
    throw new Error('Invalid Snowflake ID');
  }
}
