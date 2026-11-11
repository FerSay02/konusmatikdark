export const ASR_V1_ID = 'konusmatik-asr-v1';

export const errorsRetry = `import os
import time
import openai
from openai import OpenAI

client = OpenAI(api_key=os.environ["KONUSMATIK_API_KEY"], base_url="https://api.konusmatik.com/api/v1")
result = None
for attempt in range(2):
    try:
        result = client.audio.speech.create(
            model="konusmatik-tts", voice="sila", input="Merhaba, Konuşmatik'e hoş geldiniz."
        )
        break
    except openai.RateLimitError as e:
        if attempt == 0:
            try:
                v = int(e.response.headers.get("retry-after", 1))
            except (TypeError, ValueError):
                v = 1
            time.sleep(max(0, min(v, 30)))
            continue
        code = e.body.get("code") if isinstance(e.body, dict) else None
        print(e.status_code, code)
    except openai.APIConnectionError as e:
        print("Bağlantı hatası:", e)
        break
    except openai.APIStatusError as e:
        code = e.body.get("code") if isinstance(e.body, dict) else None
        print(e.status_code, code)
        break
`;

export const modelsList = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

models = client.models.list()
for model in models.data:
    print(model.id)
`;

export const modelsRetrieve = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

model = client.models.retrieve("konusmatik-asr-v1")
print(model.id, model.owned_by)
`;

export const nativeRealtime = `import asyncio
import json
import os
import wave
import websockets

URL = "wss://api.konusmatik.com/api/v1/realtime/transcriptions"


async def main():
    headers = {"Authorization": f"Bearer {os.environ['KONUSMATIK_API_KEY']}"}
    async with websockets.connect(URL, additional_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "session.start",
            "model": "konusmatik-asr-v2",
            "language": "tr",
            "encoding": "pcm_s16le",
            "sample_rate": 16000,
            "timestamp_granularities": ["segment", "word"],
        }))
        while json.loads(await asyncio.wait_for(ws.recv(), timeout=5.0)).get("type") != "session.ready":
            pass

        with wave.open("ornek.wav", "rb") as wf:
            while chunk := wf.readframes(1600):
                await ws.send(chunk)
                await asyncio.sleep(0.1)

        await ws.send(json.dumps({"type": "session.stop"}))
        final_text, words = "", []
        while True:
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5.0))
            if msg.get("type") == "transcript.partial":
                print("Ara sonuç:", msg.get("text"))
            elif msg.get("type") == "transcript.final":
                final_text, words = msg.get("text", ""), msg.get("words", [])
                print("Nihai sonuç:", final_text)
            elif msg.get("type") == "session.closed":
                break
        return final_text, words


final_text, words = asyncio.run(main())
`;

export const realtimeClientCommit = `import asyncio
import base64
import os
import wave
from openai import AsyncOpenAI


async def send_audio(conn, max_chunks=None):
    with wave.open("ornek.wav", "rb") as wf:
        n = 0
        while chunk := wf.readframes(1600):
            await conn.input_audio_buffer.append(audio=base64.b64encode(chunk).decode("ascii"))
            await asyncio.sleep(0.1)
            n += 1
            if max_chunks and n >= max_chunks:
                break


async def main():
    client = AsyncOpenAI(api_key=os.environ["KONUSMATIK_API_KEY"], base_url="https://api.konusmatik.com/api/v1")
    async with client.realtime.connect(model="konusmatik-asr-v1") as conn:
        await conn.session.update(session={"turn_detection": None})
        transcripts = []
        for i, chunks in enumerate([None, 3], start=1):
            await send_audio(conn, max_chunks=chunks)
            await conn.input_audio_buffer.commit()
            while (evt := await asyncio.wait_for(conn.recv(), timeout=5.0)).type != "conversation.item.input_audio_transcription.completed":
                pass
            print(f"{i}. Cümle:", evt.transcript)
            transcripts.append(evt.transcript)
        return transcripts


transcripts = asyncio.run(main())
`;

export const realtimeServerVad = `import asyncio
import base64
import os
import wave
from openai import AsyncOpenAI


async def main():
    client = AsyncOpenAI(api_key=os.environ["KONUSMATIK_API_KEY"], base_url="https://api.konusmatik.com/api/v1")
    async with client.realtime.connect(model="konusmatik-asr-v1") as conn:
        await conn.session.update(session={"audio": {"input": {
            "format": {"type": "audio/pcm", "rate": 16000},
            "turn_detection": {"type": "server_vad", "silence_duration_ms": 1000},
        }}})
        with wave.open("ornek.wav", "rb") as wf:
            while chunk := wf.readframes(1600):
                await conn.input_audio_buffer.append(audio=base64.b64encode(chunk).decode("ascii"))
                await asyncio.sleep(0.1)

        silence = base64.b64encode(b"\\x00" * 3200).decode("ascii")
        for _ in range(15):
            await conn.input_audio_buffer.append(audio=silence)
            await asyncio.sleep(0.1)

        transcripts = []
        while True:
            try:
                evt = await asyncio.wait_for(conn.recv(), timeout=0.6 if transcripts else 5.0)
            except asyncio.TimeoutError:
                break
            if evt.type == "conversation.item.input_audio_transcription.delta":
                print(evt.delta, end="", flush=True)
            elif evt.type == "conversation.item.input_audio_transcription.completed":
                print("\\nTamamlandı:", evt.transcript)
                transcripts.append(evt.transcript)

        merged_text = " ".join(t.strip() for t in transcripts if t.strip())
        print("Birleştirilmiş metin:", merged_text)
        return transcripts, merged_text


transcripts, merged_text = asyncio.run(main())
`;

export const sttJson = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

with open("ornek.wav", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="konusmatik-asr-v2",
        file=audio_file,
    )
print(transcription.text)
`;

export const sttSrt = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

with open("ornek.wav", "rb") as audio_file:
    srt = client.audio.transcriptions.create(
        model="konusmatik-asr-v2",
        file=audio_file,
        response_format="srt",
    )
with open("ornek.srt", "w", encoding="utf-8") as f:
    f.write(srt)
`;

export const sttVerboseWords = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

with open("ornek.wav", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="konusmatik-asr-v2",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"],
    )
for word in transcription.words or []:
    print(f"{word.word}: {word.start} -> {word.end}")
`;

export const ttsMp3Speed = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

response = client.audio.speech.create(
    model="konusmatik-tts",
    voice="sila",
    input="Merhaba, Konuşmatik'e hoş geldiniz.",
    response_format="mp3",
    speed=1.25,
)
response.write_to_file("merhaba.mp3")
`;

export const ttsPcmStream = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

total_bytes = 0
with client.audio.speech.with_streaming_response.create(
    model="konusmatik-tts",
    voice="sila",
    input="Merhaba, Konuşmatik'e hoş geldiniz.",
    response_format="pcm",
) as response:
    sample_rate = response.headers.get("x-audio-sample-rate", "48000")
    with open("merhaba.pcm", "wb") as f:
        for chunk in response.iter_bytes():
            f.write(chunk)
            total_bytes += len(chunk)
print(f"{sample_rate} Hz, {total_bytes} bytes")
`;

export const ttsWav = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="https://api.konusmatik.com/api/v1",
)

response = client.audio.speech.create(
    model="konusmatik-tts",
    voice="sila",
    input="Merhaba, Konuşmatik'e hoş geldiniz.",
)
response.write_to_file("merhaba.wav")
`;
