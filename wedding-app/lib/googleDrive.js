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
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  const refreshToken = getEnv('GOOGLE_REFRESH_TOKEN');

  const auth = new google.auth.OAuth2({
    clientId,
    clientSecret
  });

  auth.setCredentials({
    refresh_token: refreshToken
  });

  return auth;
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
