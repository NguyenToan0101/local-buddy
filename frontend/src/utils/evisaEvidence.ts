export const EVISA_EVIDENCE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf,.pdf';
export const EVISA_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_EVISA_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;
const ALLOWED_EVISA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function isAllowedEVisaEvidenceFile(file: File) {
  const mediaType = file.type.toLowerCase();
  return ALLOWED_EVISA_MIME_TYPES.has(mediaType) || ALLOWED_EVISA_EXTENSIONS.test(file.name);
}

export function isPdfEvidence(value?: string | null) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.startsWith('data:application/pdf')
    || /\.pdf(?:[?#]|$)/i.test(normalized)
    || normalized.includes('/raw/upload/');
}
