from __future__ import annotations
import os
import sys
import uuid
import shutil
import subprocess
import tempfile
import av

# Patch PyAV 19 compatibility with faster-whisper
_orig_av_open = av.open
def _compat_av_open(*args, **kwargs):
    kwargs.pop('metadata_errors', None)
    return _orig_av_open(*args, **kwargs)
av.open = _compat_av_open

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from faster_whisper import WhisperModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
stt = WhisperModel(os.getenv("WHISPER_MODEL", "small"), compute_type="int8")   # multilingual, auto language detect
emb = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")             # 384-dim, multilingual

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VOICES = {"en": os.path.join(BASE_DIR, "voices", "en_US-lessac-medium.onnx")}   # add "hi": "voices/hi_IN-...onnx" etc.

@app.post("/stt")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(await file.read())
        f.flush()
        temp_path = f.name
    try:
        segs, info = stt.transcribe(temp_path, vad_filter=True, beam_size=1)
        return {"text": " ".join(s.text.strip() for s in segs).strip(), "language": info.language}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

class Texts(BaseModel):
    texts: list[str]

@app.post("/embed")
def embed(b: Texts):
    return {"vectors": emb.encode(b.texts, normalize_embeddings=True).tolist()}

class TTS(BaseModel):
    text: str
    lang: str = "en"

@app.post("/tts")
def tts(b: TTS):
    voice = VOICES.get(b.lang, VOICES["en"])
    piper_cmd = shutil.which("piper") or os.path.join(os.path.dirname(sys.executable), "piper")
    tmp_dir = tempfile.gettempdir()
    raw = os.path.join(tmp_dir, f"raw_{uuid.uuid4().hex}.wav")
    out = os.path.join(tmp_dir, f"out_{uuid.uuid4().hex}.wav")
    subprocess.run([piper_cmd, "--model", voice, "--output_file", raw], input=b.text.encode(), check=True)
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-i", raw, "-ar", "8000", "-ac", "1", "-sample_fmt", "s16", out], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)   # telephony-friendly 8kHz
        return FileResponse(out, media_type="audio/wav")
    return FileResponse(raw, media_type="audio/wav")
