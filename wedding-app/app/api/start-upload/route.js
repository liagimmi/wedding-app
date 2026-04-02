import { google } from 'googleapis';

export async function POST(request) {
  try {
    const { fileName, mimeType } = await request.json();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType
        },
        body: JSON.stringify({
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        })
      }
    );

    const uploadUrl = res.headers.get('location');

    return Response.json({ uploadUrl });

  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Errore creazione upload' }, { status: 500 });
  }
}
