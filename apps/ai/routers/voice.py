import base64
import tempfile
import os
from fastapi import APIRouter, HTTPException
from models.schemas import VoiceRequest, VoiceResponse

router = APIRouter()


@router.post("/voice", response_model=VoiceResponse)
async def transcribe_voice(payload: VoiceRequest):
    """
    Transcribe audio using faster-whisper.
    Accepts base64-encoded audio (webm/mp4/wav).
    Returns transcribed text, detected language, and confidence.
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise HTTPException(status_code=503, detail="faster-whisper not installed")

    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio data")

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Load small multilingual model (downloads ~150MB on first run)
        model = WhisperModel("small", device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            tmp_path,
            language=payload.language if payload.language != "auto" else None,
            beam_size=5,
        )

        text = " ".join(seg.text for seg in segments).strip()
        language = info.language
        confidence = float(info.language_probability)

        return VoiceResponse(text=text, language=language, confidence=confidence)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
