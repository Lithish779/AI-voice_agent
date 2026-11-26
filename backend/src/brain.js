import Redis from 'ioredis';
import { Call, Appointment, Customer } from './models.js';
import { groq } from './llm.js';
import { retrieve } from './rag.js';

export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const CO = process.env.COMPANY_NAME || 'Acme Solar';

async function history(callId) {
  try {
    return (await redis.lrange(`call:${callId}`, 0, -1)).map(JSON.parse);
  } catch {
    return [];
  }
}

export async function handleTurn(callId, text, caller = 'web') {
  const isShortGreeting = text.trim().split(/\s+/).length <= 2 && /^(hi|hello|hey|yes|no|sure|okay|yep|thanks|thank you|bye)/i.test(text.trim());

  const [hist, docs, cust] = await Promise.all([
    history(callId),
    isShortGreeting ? Promise.resolve([]) : retrieve(text, 2).catch(() => []),
    Customer.findOne({ phone: caller }).lean().catch(() => null),
  ]);

  const knowledgeContext = docs.length ? 'KNOWLEDGE BASE:\n' + docs.map(d => d.text).join('\n---\n') : '';
  const customerContext = cust ? `CUSTOMER RECORD: ${JSON.stringify(cust)}` : '';
  const nowIso = new Date().toISOString();
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const UNIFIED_SYSTEM = `You are a real-time, friendly, high-conversion voice sales agent for ${CO}.
Current date/time: ${todayStr} (${nowIso}).

Return a SINGLE valid JSON object:
{
  "reply": "1-2 short, spoken conversational sentences. Direct, natural, and friendly. No markdown, no bullet points.",
  "intent": "knowledge|booking|transactional|escalate|smalltalk",
  "sentiment": "positive|neutral|negative",
  "language": "en",
  "lead": {"name": null, "need": null, "budget": null, "timeline": null},
  "booking": {"slot": "ISO datetime string if customer requested an appointment/demo date & time, else null"},
  "lead_score": 0-100
}

RULES:
1. "reply" MUST be 1-2 short, direct spoken sentences suitable for phone audio (under 25 words).
2. NEVER repeat, rephrase, or echo the caller's question back to them. Give the direct factual answer immediately.
3. Answer questions accurately using KNOWLEDGE BASE facts (quote pricing, battery storage, warranties).
4. If caller requests a booking/demo time (e.g. tomorrow, 2pm, Friday), calculate the slot as ISO datetime in "booking.slot".
5. If caller provides their name or budget, extract them into "lead".
6. If caller wants a human manager or is very angry, set "intent": "escalate" and reassure them you're transferring.

${knowledgeContext}
${customerContext}`;

  const raw = await groq([
    { role: 'system', content: UNIFIED_SYSTEM },
    ...hist.slice(-6),
    { role: 'user', content: text }
  ], true);

  let a;
  try {
    a = JSON.parse(raw);
  } catch (err) {
    a = {
      reply: raw.replace(/[{}]/g, '').trim(),
      intent: 'knowledge',
      sentiment: 'positive',
      language: 'en',
      lead_score: 60
    };
  }

  let reply = a.reply || "Thank you for reaching out! How can I assist you with our solar plans today?";
  let escalate = a.intent === 'escalate';

  // Instant booking conflict resolution
  if (a.booking?.slot) {
    const slot = new Date(a.booking.slot);
    if (!isNaN(slot.getTime())) {
      const clash = await Appointment.findOne({ slot, status: { $ne: 'cancelled' } });
      if (clash) {
        reply = `I apologize, but that time slot is already booked. Would an hour earlier or later work for you?`;
      } else {
        const ap = await Appointment.create({
          callId,
          name: a.lead?.name || (caller !== 'web' ? caller : 'Solar Prospect'),
          phone: caller,
          slot,
          notes: a.lead?.need || 'Voice consultation'
        });
        await Call.updateOne({ callId }, { appointmentId: String(ap._id) });
        reply = `You're all set! I've confirmed your consultation for ${slot.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      }
    }
  }

  // Update memory in Redis
  try {
    for (const m of [{ role: 'user', content: text }, { role: 'assistant', content: reply }]) {
      await redis.rpush(`call:${callId}`, JSON.stringify(m));
    }
    await redis.expire(`call:${callId}`, 3600);
  } catch {}

  // Update Call in MongoDB
  const set = { language: a.language || 'en', sentiment: a.sentiment || 'neutral', escalated: escalate || undefined };
  for (const k of ['name', 'need', 'budget', 'timeline']) {
    if (a.lead?.[k]) set[`lead.${k}`] = a.lead[k];
  }
  set['lead.score'] = a.lead_score || 50;
  await Call.updateOne(
    { callId },
    {
      $set: set,
      $push: {
        turns: {
          $each: [
            { role: 'user', text, intent: a.intent, sentiment: a.sentiment },
            { role: 'agent', text: reply }
          ]
        }
      }
    },
    { upsert: true }
  );

  return { reply, analysis: a, escalate };
}

export async function finalize(callId) {
  const call = await Call.findOne({ callId });
  if (!call || call.status === 'ended') return;
  const transcript = (call.turns || []).map(t => `${t.role}: ${t.text}`).join('\n');
  let s = {};
  if (transcript) {
    try {
      s = JSON.parse(await groq([
        { role: 'system', content: 'Summarise this sales call. JSON: {"summary":"2-3 sentences","nextAction":"one line","sentiment":"positive|neutral|negative","lead_score":0-100}' },
        { role: 'user', content: transcript }
      ], true));
    } catch {}
  }
  await Call.updateOne(
    { callId },
    {
      status: 'ended',
      endedAt: new Date(),
      summary: s.summary || 'Inbound voice inquiry completed.',
      nextAction: s.nextAction || 'Follow up with customer.',
      sentiment: s.sentiment || call.sentiment,
      'lead.score': s.lead_score ?? call.lead?.score
    }
  );
  try {
    await redis.del(`call:${callId}`);
  } catch {}
}
