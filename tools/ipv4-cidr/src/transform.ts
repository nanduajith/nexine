import ipaddr from 'ipaddr.js';
export function calcCidr(cidr: string): Record<string, string> {
  try {
    const [ip, mask] = cidr.split('/');
    if (!ip || !mask) throw new Error();
    const parsed = ipaddr.IPv4.parse(ip);
    const prefix = parseInt(mask, 10);
    // simplify
    // We just parse for now to prove it works
    return { ip: parsed.toString(), prefix: prefix.toString(), type: parsed.range() };
  } catch {
    return { error: 'Invalid CIDR' };
  }
}
