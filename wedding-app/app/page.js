'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Wedding Memories';
const MAX_VIDEO_SECONDS = 120;

export default function HomePage() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('Inizializzazione fotocamera...');
  const [error, setError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [capturedFile, setCapturedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lastUploadedName, setLastUploadedName] = useState('');
  const [cameraMode, setCameraMode] = useState('environment');

  const canUpload = useMemo(() => !!capturedFile && !uploading, [capturedFile, uploading]);

  async function setupCamera(mode = cameraMode) {
    try {
      setError('');
      setStatus('Inizializzazione fotocamera...');
      setIsCameraReady(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraReady(true);
      setStatus('Fotocamera pronta.');
    } catch (err) {
      console.error(err);
      setIsCameraReady(false);
      setError('Non riesco ad accedere a fotocamera o microfono. Controlla i permessi del browser.');
      setStatus('Accesso non disponibile.');
    }
  }

  useEffect(() => {
    let revokedUrl = '';

    setupCamera(cameraMode);

    return () => {
      clearInterval(timerRef.current);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (previewUrl) {
        revokedUrl = previewUrl;
      }

      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, []);

  function resetPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setCapturedFile(null);
    setLastUploadedName('');
  }

  async function toggleCamera() {
    if (isRecording || uploading) return;

    const nextMode = cameraMode === 'environment' ? 'user' : 'environment';
    setCameraMode(nextMode);
    await setupCamera(nextMode);
  }

  async function takePhoto() {
    try {
      if (!videoRef.current) return;

      resetPreview();

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) {
        throw new Error('Photo capture failed');
      }

      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);

      setCapturedFile(file);
      setPreviewUrl(url);
      setStatus('Foto pronta. Premi “Carica” per salvarla.');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Errore durante lo scatto della foto.');
    }
  }

  function startRecording() {
    try {
      if (!streamRef.current) return;
  
      resetPreview();
  
      const candidates = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ];
  
      const selectedMimeType = candidates.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });
  
      chunksRef.current = [];
  
      const recorder = selectedMimeType
        ? new MediaRecorder(streamRef.current, { mimeType: selectedMimeType })
        : new MediaRecorder(streamRef.current);
  
      mediaRecorderRef.current = recorder;
  
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
  
      recorder.onstop = () => {
        const actualMimeType = recorder.mimeType || selectedMimeType || 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
  
        let extension = 'mp4';
        if (actualMimeType.includes('webm')) extension = 'webm';
        else if (actualMimeType.includes('quicktime')) extension = 'mov';
        else if (actualMimeType.includes('ogg')) extension = 'ogg';
  
        const file = new File([blob], `video_${Date.now()}.${extension}`, {
          type: actualMimeType
        });
  
        const url = URL.createObjectURL(file);
        setCapturedFile(file);
        setPreviewUrl(url);
        setStatus('Video pronto. Premi “Carica” per salvarlo.');
        setError('');
      };
  
      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      setStatus('Registrazione in corso...');
      setError('');
  
      timerRef.current = setInterval(() => {
        setRecordSeconds((current) => {
          const next = current + 1;
          if (next >= MAX_VIDEO_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Il browser non supporta la registrazione video su questo dispositivo.');
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }

  async function uploadFile() {
    if (!capturedFile) return;

    setUploading(true);
    setError('');
    setStatus('Caricamento in corso...');

    try {
      const maxMb = 1024;
      const maxBytes = maxMb * 1024 * 1024;
  
      if (capturedFile.size > maxBytes) {
        throw new Error(`Il file supera il limite di ${maxMb} MB`);
      }
      
      const formData = new FormData();
      formData.append('media', capturedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let payload = null;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Errore durante l’upload');
      }
      
      if (!response.ok) {
        throw new Error(payload?.error || 'Upload fallito');
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Upload fallito');
      }

      setLastUploadedName(payload.fileName);
      setStatus('Upload completato con successo.');
      setCapturedFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Si è verificato un errore durante il caricamento.');
      setStatus('Upload non completato.');
    } finally {
      setUploading(false);
    }
  }

  function onManualPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    resetPreview();
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus('File selezionato. Premi “Carica” per salvarlo.');
    setError('');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#fff',
          borderRadius: 24,
          padding: 20,
          boxShadow: '0 12px 36px rgba(0,0,0,0.08)'
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: 20 }}>
          <p
            style={{
              margin: 0,
              letterSpacing: 2,
              fontSize: 12,
              textTransform: 'uppercase',
              color: '#836953'
            }}
          >
            Benvenuti
          </p>
          <h1 style={{ margin: '8px 0 6px', fontSize: 32 }}>{APP_NAME}</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Scatta una foto o registra un video per lasciare un ricordo agli sposi.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              background: '#111',
              aspectRatio: '3 / 4'
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: cameraMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {!isCameraReady && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  padding: 16,
                  textAlign: 'center'
                }}
              >
                <span>{status}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12
            }}
          >
            <button
              onClick={takePhoto}
              disabled={!isCameraReady || isRecording || uploading}
              style={buttonStyle}
            >
              Scatta foto
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!isCameraReady || uploading}
                style={buttonStyle}
              >
                Registra video
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={{ ...buttonStyle, background: '#8a1c1c', color: '#fff' }}
              >
                Ferma ({recordSeconds}s)
              </button>
            )}

            <button
              type="button"
              onClick={toggleCamera}
              disabled={!isCameraReady || isRecording || uploading}
              style={ghostButtonStyle}
            >
              {cameraMode === 'environment' ? 'Camera frontale' : 'Camera posteriore'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ ...ghostButtonStyle, width: '100%' }}
            disabled={uploading}
          >
            Oppure scegli da galleria
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            hidden
            onChange={onManualPick}
          />

          {previewUrl && (
            <div style={{ padding: 14, background: '#f7f2ea', borderRadius: 18 }}>
              <p style={{ marginTop: 0, marginBottom: 10, fontWeight: 700 }}>Anteprima</p>

              {capturedFile?.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Anteprima contenuto"
                  style={{ width: '100%', borderRadius: 16 }}
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  style={{ width: '100%', borderRadius: 16 }}
                />
              )}
            </div>
          )}

          <button onClick={uploadFile} disabled={!canUpload} style={{ ...buttonStyle, width: '100%' }}>
            {uploading ? 'Caricamento...' : 'Carica su Drive'}
          </button>

          <div
            style={{
              background: '#fcfaf7',
              border: '1px solid #eee4d8',
              borderRadius: 18,
              padding: 14
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>Stato</p>
            <p style={{ marginBottom: 0, color: '#444' }}>{status}</p>
            {error ? <p style={{ marginBottom: 0, color: '#b00020' }}>{error}</p> : null}
            {lastUploadedName ? (
              <p style={{ marginBottom: 0, color: '#22663d' }}>File salvato: {lastUploadedName}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

const buttonStyle = {
  border: 'none',
  borderRadius: 16,
  padding: '16px 18px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  background: '#d9b382',
  color: '#1f1f1f'
};

const ghostButtonStyle = {
  border: '1px solid #d9c8b2',
  borderRadius: 16,
  padding: '14px 18px',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  background: '#fff',
  color: '#4a3e34'
};
