export function parseUrl(urlStr: string): Record<string, string> {
  try {
    const u = new URL(urlStr);
    const params = Object.fromEntries(u.searchParams.entries());
    return {
      href: u.href,
      protocol: u.protocol,
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      username: u.username,
      password: u.password,
      ...params,
    };
  } catch {
    return { error: 'Invalid URL' };
  }
}
