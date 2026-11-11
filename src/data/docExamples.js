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
