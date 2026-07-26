import type { pki } from 'node-forge';
import forge from 'node-forge';

export interface CertInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  signatureOid: string;
}

function parseAttributes(attributes: pki.CertificateField[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const attr of attributes) {
    result[attr.shortName || attr.name || 'unknown'] = attr.value as string;
  }
  return result;
}

export function decodeCert(pem: string): CertInfo {
  try {
    const cert = forge.pki.certificateFromPem(pem);
    return {
      subject: parseAttributes(cert.subject.attributes),
      issuer: parseAttributes(cert.issuer.attributes),
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
      serialNumber: cert.serialNumber,
      signatureOid: cert.signatureOid,
    };
  } catch (err) {
    throw new Error(
      'Invalid PEM certificate: ' + (err instanceof Error ? err.message : String(err)),
    );
  }
}
