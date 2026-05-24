const OLD_PROFILE_IMAGE_ORIGIN = 'https://fitpulsebot.profile.s3.ap-south-1.amazonaws.com';
export const PROFILE_IMAGE_ORIGIN = 'https://profile.fitpulsebot.fit';

export function normalizeProfileImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (!value.startsWith(OLD_PROFILE_IMAGE_ORIGIN)) return value;
  return `${PROFILE_IMAGE_ORIGIN}${value.slice(OLD_PROFILE_IMAGE_ORIGIN.length)}`;
}

