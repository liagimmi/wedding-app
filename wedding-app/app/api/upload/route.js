import { uploadBufferToDrive } from '../../../lib/googleDrive';

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const VIDEO_TYPES = new Set([
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
  'video/mpeg',
  'video/ogg',
  'application/octet-stream'
]);

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const VIDEO_EXTENSIONS = new Set(['webm', 'mp4', 'mov', 'mkv', '3gp', '3g2', 'm4v', 'mpeg', 'mpg', 'ogg']);

function sanitizeFileName(input) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('media');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Nessun file ricevuto.' }, { status: 400 });
    }

    const maxMb = Number(process.env.UPLOAD_MAX_MB || 150);
    const maxBytes = maxMb * 1024 * 1024;

    if (file.size > maxBytes) {
      return Response.json({ error: `Il file supera il limite di ${maxMb} MB.` }, { status: 413 });
    }

    const mimeType = (file.type || '').toLowerCase().trim();
    const extension = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase().trim()
      : '';

    const isAllowedByMime = IMAGE_TYPES.has(mimeType) || VIDEO_TYPES.has(mimeType);
    const isAllowedByExtension =
      IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);

    if (!isAllowedByMime && !isAllowedByExtension) {
      return Response.json(
        { error: `Formato non supportato: ${mimeType || extension || 'sconosciuto'}` },
        { status: 415 }
      );
    }

    const isImage =
      mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(extension);

    const finalExtension =
      extension || (isImage ? 'jpg' : 'mp4');

    const mediaType = isImage ? 'photo' : 'video';

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fileName = sanitizeFileName(`wedding_${mediaType}_${uniqueId}.${finalExtension}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToDrive({
      buffer,
      mimeType: mimeType || (isImage ? 'image/jpeg' : 'video/mp4'),
      fileName
    });

    return Response.json({
      success: true,
      fileId: uploaded.id,
      fileName: uploaded.name
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Errore server durante il caricamento su Google Drive.' },
      { status: 500 }
    );
  }
}
