import { Linking, Platform } from 'react-native';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com'];

export type ContentUrlKind = 'image' | 'video' | 'document' | 'external';

export function getContentUrlKind(url: string): ContentUrlKind {
  const cleanUrl = stripQueryAndHash(url).toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext))) return 'image';
  if (VIDEO_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext))) return 'video';
  if (VIDEO_HOSTS.some((host) => cleanUrl.includes(host))) return 'video';
  if (DOCUMENT_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext))) return 'document';
  return 'external';
}

export function getEmbeddableVideoUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1] || parsed.pathname.match(/\/embed\/([^/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getOpenLabel(url: string): string {
  const kind = getContentUrlKind(url);
  if (kind === 'image') return 'Open image';
  if (kind === 'video') return 'Open video';
  if (kind === 'document') return 'Open file';
  return 'Open link';
}

export async function openContentUrl(url: string) {
  if (Platform.OS === 'web') {
    const browserWindow = (globalThis as any).window;
    if (browserWindow?.open) {
      browserWindow.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  }
  await Linking.openURL(url);
}

function stripQueryAndHash(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}
