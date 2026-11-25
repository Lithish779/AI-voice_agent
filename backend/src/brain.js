import Redis from 'ioredis';
import { Call, Appointment, Customer } from './models.js';
import { groq } from './llm.js';
import { retrieve } from './rag.js';
export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const CO = process.env.COMPANY_NAME || 'Acme';

const CLASSIFY = `You analyse one turn of a sales/support phone call for ${CO}. Return JSON:
{"intent":"knowledge|booking|transactional|escalate|smalltalk","sentiment":"positive|neutral|negative","language":"ISO code of caller's language",
"lead":{"name":null,"need":null,"budget":null,"timeline":null},
"booking":{"slot":"ISO datetime or null"}, "lead_score":0-100}
intent: knowledge=product/policy questions; booking=wants a demo/appointment; transactional=asks about THEIR order/account; escalate=wants a human or is angry. Use null for unknown fields.`;

async function history(callId) { return (await redis.lrange(`call:${callId}`, 0, -1)).map(JSON.parse); }

export async function handleTurn(callId, text, caller = 'web') {
  const hist = await history(callId);
  const a = JSON.parse(await groq([{ role: 'system', content: CLASSIFY }, ...hist.slice(-6), { role: 'user', content: text }], true));
  let context = '', escalate = false, reply;

  if (a.intent === 'knowledge') {
    const docs = await retrieve(text);
    context = 'KNOWLEDGE:\n' + docs.map(d => d.text).join('\n---\n');
  } else if (a.intent === 'transactional') {
    const c = await Customer.findOne({ phone: caller }).lean();
    context = c ? `CUSTOMER RECORD: ${JSON.stringify(c)}` : 'No customer record found for this number; ask for their registered phone/order id.';
  } else if (a.intent === 'booking') {
    const slot = a.booking?.slot && new Date(a.booking.slot);
    if (slot && !isNaN(slot)) {
      const clash = await Appointment.findOne({ slot });
      if (clash) context = 'BOOKING: requested slot is taken; offer another time.';
      else { const ap = await Appointment.create({ callId, name: a.lead?.name, phone: caller, slot, notes: a.lead?.need });
             await Call.updateOne({ callId }, { appointmentId: String(ap._id) });
             context = `BOOKING CONFIRMED for ${slot.toISOString()}. Confirm it to the caller.`; }
    } else context = 'BOOKING: ask the caller which date and time they prefer.';
  } else if (a.intent === 'escalate') { escalate = true; context = 'Tell the caller you are transferring them to a human agent.'; }

  reply = await groq([
    { role: 'system', content: `You are a friendly, concise voice sales agent for ${CO}. Reply in language "${a.language}", max 2 short spoken sentences, no markdown. Use ONLY the provided context for facts; if unknown, say you will have a specialist follow up. Gently qualify the lead (need, budget, timeline) when natural.\n${context}` },
    ...hist.slice(-8), { role: 'user', content: text }]);

  for (const m of [{ role: 'user', content: text }, { role: 'assistant', content: reply }]) await redis.rpush(`call:${callId}`, JSON.stringify(m));
  await redis.expire(`call:${callId}`, 3600);
  const set = { language: a.language, sentiment: a.sentiment, escalated: escalate || undefined };
  for (const k of ['name', 'need', 'budget', 'timeline']) if (a.lead?.[k]) set[`lead.${k}`] = a.lead[k];
  set['lead.score'] = a.lead_score;
  await Call.updateOne({ callId }, { $set: set, $push: { turns: { $each: [
    { role: 'user', text, intent: a.intent, sentiment: a.sentiment }, { role: 'agent', text: reply }] } } }, { upsert: true });
  return { reply, analysis: a, escalate };
}

export async function finalize(callId) {
  const call = await Call.findOne({ callId });
  if (!call || call.status === 'ended') return;
  const transcript = call.turns.map(t => `${t.role}: ${t.text}`).join('\n');
  let s = {};
  if (transcript) s = JSON.parse(await groq([{ role: 'system', content: 'Summarise this sales call. JSON: {"summary":"2-3 sentences","nextAction":"one line","sentiment":"positive|neutral|negative","lead_score":0-100}' }, { role: 'user', content: transcript }], true));
  await Call.updateOne({ callId }, { status: 'ended', endedAt: new Date(), summary: s.summary, nextAction: s.nextAction, sentiment: s.sentiment || call.sentiment, 'lead.score': s.lead_score ?? call.lead?.score });
  await redis.del(`call:${callId}`);
}
