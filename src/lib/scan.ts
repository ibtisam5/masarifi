import Constants from 'expo-constants';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { ExpenseDraft } from './expenses';

export type ScanResult =
  | { ok: true; draft: ExpenseDraft; remaining?: number; missingDate?: boolean }
  | { ok: false; error: string }
  | { ok: false; canceled: true };

/** Where the API lives. Web uses its own origin; the phone talks to the dev
 *  server on the laptop, or to EXPO_PUBLIC_API_URL once deployed. */
function apiUrl(path: string) {
  if (Platform.OS === 'web') return path;
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '') + path;
  const host = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081" in development
  return host ? `http://${host}${path}` : path;
}

async function pickImage(source: 'camera' | 'library') {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { error: 'نحتاج إذن الكاميرا عشان نصوّر الفاتورة. فعّله من الإعدادات.' };
    return ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  }
  return ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
}

export async function scanReceipt(source: 'camera' | 'library'): Promise<ScanResult> {
  const picked = await pickImage(source);
  if ('error' in picked) return { ok: false, error: picked.error as string };
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, canceled: true };

  try {
    // Shrink big phone photos: 1568px is plenty for reading a receipt and keeps
    // the upload small and the API call cheap.
    const ref = await ImageManipulator.manipulate(picked.assets[0].uri, { maxWidth: 1568 }).renderAsync();
    const image = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
    if (!image.base64) return { ok: false, error: 'تعذّر تجهيز الصورة.' };

    const res = await fetch(apiUrl('/api/scan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: image.base64, mediaType: 'image/jpeg' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? 'صار خطأ، حاول مرة ثانية.' };
    return { ok: true, draft: data.draft, remaining: data.remaining, missingDate: data.missingDate };
  } catch (error) {
    console.warn('scan failed', error);
    return { ok: false, error: 'ما قدرت أتصل بالسيرفر. تأكد من الإنترنت وحاول مرة ثانية.' };
  }
}
