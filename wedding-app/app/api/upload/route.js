import { uploadBufferToDrive } from '../../../lib/googleDrive';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set([
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/3gpp'
]);

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

    const mimeType = file.type || 'application/octet-stream';
    const isAllowed = IMAGE_TYPES.has(mimeType) || VIDEO_TYPES.has(mimeType);
    if (!isAllowed) {
      return Response.json({ error: `Formato non supportato: ${mimeType}` }, { status: 415 });
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop() : (mimeType.startsWith('image/') ? 'jpg' : 'webm');
    const mediaType = mimeType.startsWith('image/') ? 'photo' : 'video';
    const fileName = sanitizeFileName(`wedding_${mediaType}_${Date.now()}.${extension}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToDrive({
      buffer,
      mimeType,
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
