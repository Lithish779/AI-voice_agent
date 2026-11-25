import ari from 'ari-client';
import fs from 'fs/promises';
import { stt, tts } from './llm.js';
import { handleTurn, finalize } from './brain.js';

export async function startARI() {
  const client = await ari.connect(process.env.ARI_URL, process.env.ARI_USER, process.env.ARI_PASS);
  const once = (obj, ev) => new Promise(r => obj.once(ev, r));

  client.on('StasisStart', async (ev, ch) => {
    const callId = ch.id, caller = ch.caller?.number || 'unknown';
    let alive = true; ch.on('StasisEnd', () => { alive = false; finalize(callId).catch(console.error); });
    const say = async (text, lang = 'en') => {
      const name = `${callId}-${Date.now()}`;
      await fs.writeFile(`/sounds/${name}.wav`, await tts(text, lang));
      const pb = client.Playback(); await ch.play({ media: `sound:va/${name}` }, pb); await once(pb, 'PlaybackFinished');
      fs.unlink(`/sounds/${name}.wav`).catch(() => {});
    };
    try {
      await ch.answer();
      await say(`Hello, thanks for calling ${process.env.COMPANY_NAME || 'us'}. How can I help you today?`);
      let silent = 0;
      while (alive) {
        const rname = `${callId}-${Date.now()}`, rec = client.LiveRecording();
        await ch.record({ name: rname, format: 'wav', maxSilenceSeconds: 10, maxDurationSeconds: 60, beep: false, ifExists: 'overwrite' }, rec);
        await once(rec, 'RecordingFinished');
        const buf = await fs.readFile(`/recordings/${rname}.wav`).catch(() => null);
        const { text, language } = buf ? await stt(buf) : { text: '' };
        if (!text) { if (++silent >= 2) { await say('I could not hear you. Goodbye!'); break; } await say('Sorry, could you repeat that?'); continue; }
        silent = 0;
        const { reply, escalate } = await handleTurn(callId, text, caller);
        await say(reply, language);
        if (escalate) { await ch.continueInDialplan({ context: 'human', extension: 's', priority: 1 }).catch(() => {}); return; }
      }
      if (alive) await ch.hangup();
    } catch (e) { console.error('call error', e.message); }
  });
  client.start('voiceagent');
  console.log('ARI connected, app=voiceagent');
}
