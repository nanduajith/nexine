import forge from 'node-forge';
import { describe, expect, it } from 'vitest';

import { decodeCert } from './transform';

describe('cert-decoder', () => {
  it('decodes a valid PEM cert', () => {
    const keys = forge.pki.rsa.generateKeyPair(512);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [
      { name: 'commonName', value: 'example.org' },
      { name: 'countryName', value: 'US' },
      { shortName: 'ST', value: 'Virginia' },
      { name: 'localityName', value: 'Blacksburg' },
      { name: 'organizationName', value: 'Test' },
      { shortName: 'OU', value: 'Test' },
      { type: '2.5.4.999', value: 'unknown-type' }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    const pem = forge.pki.certificateToPem(cert);
    const info = decodeCert(pem);
    
    expect(info.subject.CN).toBe('example.org');
    expect(info.subject.C).toBe('US');
    expect(info.subject.ST).toBe('Virginia');
    expect(info.subject.L).toBe('Blacksburg');
    expect(info.subject.O).toBe('Test');
    expect(info.subject.OU).toBe('Test');
    expect(info.subject.unknown).toBe('unknown-type');
    
    expect(info.issuer.CN).toBe('example.org');
    expect(info.serialNumber).toBe('01');
    expect(info.validFrom).toBeInstanceOf(Date);
    expect(info.validTo).toBeInstanceOf(Date);
    expect(info.signatureOid).toBe(cert.signatureOid);
  });

  it('throws an error for invalid PEM', () => {
    expect(() => decodeCert('invalid pem string')).toThrow('Invalid PEM certificate:');
  });

  it('throws an error for empty string', () => {
    expect(() => decodeCert('')).toThrow('Invalid PEM certificate:');
  });

  it('formats error properly if not an Error instance', () => {
    const originalCertificateFromPem = forge.pki.certificateFromPem;
    (forge.pki).certificateFromPem = () => { throw 'String Error'; };
    
    try {
      expect(() => decodeCert('some pem')).toThrow('Invalid PEM certificate: String Error');
    } finally {
      (forge.pki).certificateFromPem = originalCertificateFromPem;
    }
  });
});