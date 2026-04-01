import { google } from 'googleapis';
import { Readable } from 'stream';

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildAuth() {
  const clientEmail = getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
}

export async function uploadBufferToDrive({ buffer, mimeType, fileName }) {
  const folderId = getEnv('GOOGLE_DRIVE_FOLDER_ID');
  const auth = buildAuth();
  const drive = google.drive({ version: 'v3', auth });

  const fileStream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: fileStream
    },
    fields: 'id, name, webViewLink'
  });

  return response.data;
}
