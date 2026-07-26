import forge from 'node-forge';
import { describe, expect, it } from 'vitest';

import { decodeCert } from './transform';

describe('cert-decoder', () => {
  it('decodes a valid PEM cert', () => {
    // Generate a dummy cert for testing
    const keys = forge.pki.rsa.generateKeyPair(512);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    cert.setSubject([{ name: 'commonName', value: 'example.org' }]);
    cert.setIssuer([{ name: 'commonName', value: 'example.org' }]);
    cert.sign(keys.privateKey);
    const pem = forge.pki.certificateToPem(cert);

    const info = decodeCert(pem);
    expect(info.subject.CN).toBe('example.org');
    expect(info.serialNumber).toBe('01');
  });
});
