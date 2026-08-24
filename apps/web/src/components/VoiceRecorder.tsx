import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const AI_BASE = import.meta.env.VITE_AI_URL ?? 'http://localhost:8000';

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribe(blob);
      };

      mediaRecorder.start(200);
      setRecording(true);
    } catch {
      setError('Microphone access denied');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setLoading(true);
  }

  async function transcribe(blob: Blob) {
    try {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const res = await fetch(`${AI_BASE}/ai/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: base64, language: 'hi' }),
      });

      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      onTranscription(data.text);
    } catch {
      setError('Could not transcribe. Try typing instead.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={recording ? stopRecording : startRecording}
        className={clsx(
          'relative w-14 h-14 rounded-full flex items-center justify-center transition-all',
          recording
            ? 'bg-red-500/20 border-2 border-red-500 animate-pulse-slow'
            : 'glass border-2 border-dark-border hover:border-brand-500/50',
          (disabled || loading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        ) : recording ? (
          <MicOff className="w-6 h-6 text-red-400" />
        ) : (
          <Mic className="w-6 h-6 text-gray-400" />
        )}
        {recording && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
      </button>
      <p className="text-xs text-gray-600 text-center">
        {loading ? 'Transcribing...' : recording ? 'Tap to stop' : 'Speak in Hindi or English'}
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
