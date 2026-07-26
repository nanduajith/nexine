// Entry point bundled into `plugin-guest.js` and loaded by `sandbox.html` as a
// same-origin ('self') script. It boots the host-trusted guest runtime, which
// then brokers the private channel and runs the untrusted plugin as a blob:
// script. Kept as a one-line entry so the bundle is trivially auditable.
import { runNexineGuest } from '@nexine/sdk/guest';

runNexineGuest();
