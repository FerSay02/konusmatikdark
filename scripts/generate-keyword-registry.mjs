import fs from 'node:fs';
import { seoPages } from '../content/seo-pages.mjs';

// Candidate queries are editorial hypotheses, not measured search demand.
const clusters = [
  ['Türkçe metinden sese ve okuma', '/cozumler/turkce-seslendirme/', ['Türkçe seslendirme','Türkçe metinden sese','Türkçe metni seslendirme','metni Türkçe sesli okuma','yazıyı sesli okuma Türkçe','Türkçe TTS aracı','Türkçe metin okuyucu','text to speech Turkish','Turkish text to speech','Türkçe metin seslendirme programı','yazıyı sese dönüştürme']],
  ['Yapay zekâ ses üretimi', '/cozumler/yapay-zeka-seslendirme/', ['yapay zekâ seslendirme','AI seslendirme Türkçe','yapay zekâ ile ses üretimi','dijital anlatım sesi','yapay zekâ anlatıcı','ses sentezi Türkçe','AI voice generation Turkish','Turkish AI voice','yapay zekâ ses kaydı oluşturma','kurumsal duyuru seslendirme','otomatik metin seslendirme']],
  ['Türkçe ASR ve konuşmadan yazıya', '/cozumler/sesten-metne/', ['sesten metne','Türkçe konuşmayı yazıya çevirme','speech to text Turkish','Turkish speech recognition','Türkçe ASR','konuşmadan metne dönüştürme','sesli konuşmayı yazıya dökme','otomatik konuşma tanıma Türkçe','Türkçe konuşma çözümleme','ses kaydından yazı çıkarma','ses dosyasını metne çevirme']],
  ['Ses ve video deşifre', '/cozumler/ses-kaydi-desifre/', ['ses kaydı deşifre','ses kaydını yazıya dökme','röportaj deşifre','görüşme transkripti','ses kaydı çözümleme','deşifre metni hazırlama','transcribe audio Turkish','audio transcription Turkish','konuşma kaydı metni','sesli görüşme deşifresi','kayıttan transkript çıkarma']],
  ['Desteklenen ses dosyası türleri', '/cozumler/sesten-metne/', ['MP3 deşifre','WAV deşifre','M4A deşifre','MP3 dosyasını yazıya çevirme','WAV sesini metne çevirme','M4A dosyasını metne çevirme','MP3 transcription Turkish','WAV transcription Turkish','ses dosyası biçimi deşifre','deşifre için MP3 hazırlama','deşifre için WAV hazırlama']],
  ['Eğitim podcast ve multimedya', '/cozumler/egitim-seslendirme/', ['eğitim içeriği seslendirme','e-öğrenme seslendirme','ders anlatımı seslendirme','e-learning voiceover Turkish','eğitim videosu anlatımı','ders metnini sese çevirme','podcast deşifre','podcast transkripti','podcast yazıya dökme','video deşifre','otomatik altyazı','video konuşmasını yazıya çevirme']],
  ['IVR ve kurumsal ses', '/cozumler/ivr-seslendirme/', ['IVR seslendirme','santral anonsu seslendirme','telefon menüsü seslendirme','çağrı merkezi anonsu','otomatik karşılama sesi','kurumsal telefon anonsu','IVR voiceover Turkish','Turkish IVR voice','sesli yanıt sistemi anonsu','müşteri hizmetleri seslendirme','güncellenebilir santral mesajı']],
  ['Türkçe konuşma teknolojileri', '/rehber/tts-asr-farki/', ['TTS ve ASR farkı','Türkçe konuşma teknolojileri','metinden sese nedir','sesten metne nedir','Türkçe ses sentezi','otomatik konuşma tanıma nedir','TTS nasıl çalışır','ASR nasıl çalışır','text to speech vs speech to text','Turkish language speech technology','ses teknolojisi iş akışı']],
  ['On-premise ve kurum içi sistemler', '/cozumler/on-premise-tts/', ['on-premise TTS','kurum içi metinden sese','local seslendirme','kapalı ağ seslendirme','on-premise speech recognition','kurum içi ASR','offline ses teknolojisi','local konuşma tanıma','on-premise deşifre','kurumsal ses verisi işleme','air-gapped speech system']],
  ['Teknik TTS ASR ve API kavramları', '/rehber/on-premise-ses-teknolojileri/', ['TTS API entegrasyonu','ASR API entegrasyonu','konuşma tanıma API kavramları','ses sentezi API iş akışı','asenkron deşifre nedir','streaming TTS nedir','realtime ASR nedir','ses işleme mimarisi','kurumsal TTS entegrasyonu','speech API Turkish','WAV ses çıktısı']],
];

const overrides = new Map([
  ['podcast deşifre','/cozumler/podcast-desifre/'],['podcast transkripti','/cozumler/podcast-desifre/'],['podcast yazıya dökme','/cozumler/podcast-desifre/'],
  ['video deşifre','/cozumler/video-desifre/'],['video konuşmasını yazıya çevirme','/cozumler/video-desifre/'],['otomatik altyazı','/cozumler/otomatik-altyazi/'],
  ['on-premise speech recognition','/cozumler/kurumsal-konusma-tanima/'],['kurum içi ASR','/cozumler/kurumsal-konusma-tanima/'],['local konuşma tanıma','/cozumler/kurumsal-konusma-tanima/'],['on-premise deşifre','/cozumler/kurumsal-konusma-tanima/'],
  ['offline ses teknolojisi','/rehber/on-premise-ses-teknolojileri/'],['air-gapped speech system','/rehber/on-premise-ses-teknolojileri/'],
  ['MP3 deşifre','/cozumler/ses-kaydi-desifre/'],['WAV deşifre','/cozumler/ses-kaydi-desifre/'],['M4A deşifre','/cozumler/ses-kaydi-desifre/'],
]);

const pages = new Map(seoPages.map((page) => [`/${page.section}/${page.slug}/`, page]));
const seen = new Set();
const rows = [];
for (const [cluster, defaultUrl, phrases] of clusters) {
  for (const [index, phrase] of phrases.entries()) {
    const key = phrase.toLocaleLowerCase('tr');
    if (seen.has(key)) throw new Error(`Duplicate keyword: ${phrase}`);
    seen.add(key);
    const url = overrides.get(phrase) || defaultUrl;
    const page = pages.get(url);
    if (!page) throw new Error(`Unknown target: ${url}`);
    const primary = page.keyword.toLocaleLowerCase('tr') === key;
    rows.push({
      keyword: phrase,
      search_intent: cluster.includes('farkı') || /nedir|nasıl|farkı/.test(key) ? 'informational' : cluster.includes('kavram') ? 'technical research' : 'solution research',
      topic_cluster: cluster,
      targeting_role: primary ? 'primary' : 'secondary',
      target_canonical_url: `https://konusmatik.com${url}`,
      page_section: primary ? 'H1 and introduction' : index % 2 ? 'explanatory sections and related terms' : 'supporting terms and FAQ review',
      related_terms: page.terms.join(' | '),
      implementation_status: primary ? 'published' : 'mapped; editorial wording review',
      keyword_metrics: 'unverified',
    });
  }
}
if (rows.length < 100) throw new Error('Registry must contain at least 100 candidates');
const columns = Object.keys(rows[0]);
const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => `"${String(row[column]).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n';
fs.writeFileSync(new URL('../content/keyword-registry.csv', import.meta.url), '\uFEFF' + csv, 'utf8');
console.log(`Generated ${rows.length} keyword candidates across ${clusters.length} clusters.`);
