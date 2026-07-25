/**
 * A plugin that requests `network` must also *declare what leaves and to where*
 * in plain language. Permissions say what the browser will technically allow;
 * data-flows say what the author intends — and both are shown side by side at
 * install-time consent. A mismatch (e.g. a declared destination with no matching
 * network host) is surfaced by validation, so the two can't silently diverge.
 *
 * Nexine never inspects payloads at runtime (that would defeat the no-egress
 * promise for everyone else); data-flows are a transparency contract, enforced
 * socially by review and technically by the network allowlist.
 */
export interface DataFlow {
  /** The destination host data is sent to, e.g. `api.example.com`. */
  readonly destination: string;
  /** What is sent, in the author's own words. Shown verbatim at consent time. */
  readonly description: string;
  /** Optional: whether the flow is essential to the tool or optional/telemetry. */
  readonly optional?: boolean;
}
