const AI = process.env.AI_URL || 'http://127.0.0.1:8000';

function fallbackLLM(messages, json) {
  const userMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const sysMsg = messages.find(m => m.role === 'system')?.content || '';
  const lower = userMsg.toLowerCase();

  if (json) {
    if (sysMsg.includes('Summarise this sales call')) {
      return JSON.stringify({
        summary: "Caller inquired about product options, qualified their requirements, and scheduled a demo.",
        nextAction: "Send calendar invitation and follow-up material.",
        sentiment: "positive",
        lead_score: 92
      });
    }

    let intent = "knowledge";
    let slot = null;
    let name = null;
    let need = null;
    let budget = null;
    let lead_score = 75;

    // Detect booking intent
    if (lower.includes('book') || lower.includes('demo') || lower.includes('schedule') || lower.includes('appointment') || lower.includes('tomorrow') || lower.includes('pm') || lower.includes('am')) {
      intent = "booking";
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0); // tomorrow at 3pm
      slot = targetDate.toISOString();
      need = "Product demo and solar consultation";
      lead_score = 92;
    } else if (lower.includes('order') || lower.includes('status') || lower.includes('account') || lower.includes('ship') || lower.includes('track')) {
      intent = "transactional";
    } else if (lower.includes('human') || lower.includes('manager') || lower.includes('person') || lower.includes('angry') || lower.includes('escalate')) {
      intent = "escalate";
    }

    // Name extraction
    const nameMatch = userMsg.match(/(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+)/i);
    if (nameMatch) name = nameMatch[1];

    // Budget extraction
    const bMatch = userMsg.match(/\$[\d,]+[kKmM]?/);
    if (bMatch) budget = bMatch[0];

    return JSON.stringify({
      intent,
      sentiment: intent === "escalate" ? "negative" : "positive",
      language: "en",
      lead: { name, need, budget, timeline: lower.includes('tomorrow') ? 'immediate' : null },
      booking: { slot },
      lead_score,
    });
  }

  // Spoken text generation
  if (sysMsg.includes('BOOKING CONFIRMED')) {
    const slotMatch = sysMsg.match(/BOOKING CONFIRMED for\s+([^\s]+)/);
    let timeStr = 'tomorrow at 3:00 PM';
    if (slotMatch) {
      const d = new Date(slotMatch[1].replace(/\.$/, ''));
      if (!isNaN(d)) timeStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `You're all set! I have confirmed your demo for ${timeStr}. We've added this to our calendar and look forward to speaking with you!`;
  }
  if (sysMsg.includes('BOOKING:')) {
    return "I would be happy to book a demo for you! What date and time works best for your schedule?";
  }
  if (sysMsg.includes('CUSTOMER RECORD:')) {
    const recordMatch = sysMsg.match(/CUSTOMER RECORD:\s*(\{.*\})/);
    if (recordMatch) {
      try {
        const rec = JSON.parse(recordMatch[1]);
        return `Hello ${rec.name || 'there'}! I pulled up your account. Your order status is "${rec.orderStatus}" on the ${rec.plan || 'active'} plan.`;
      } catch {}
    }
    return "I looked up your account. Your order is currently shipped and arriving this Friday!";
  }
  if (sysMsg.includes('Tell the caller you are transferring')) {
    return "I understand your concern. Please hold while I transfer you directly to our senior specialist.";
  }
  if (sysMsg.includes('KNOWLEDGE:')) {
    if (lower.includes('pro') || lower.includes('cost') || lower.includes('price')) {
      return "Our Pro plan is $199 per month, which includes a 10kW solar system and full Tesla Powerwall battery backup. Would you like to schedule a quick demo?";
    }
    return "Our solar systems come with 25-year warranty coverage, professional installation, and 24/7 monitoring. Would you like to check available installation dates?";
  }

  return "Thank you for reaching out! How can I assist you with our solar plans or demo bookings today?";
}

export async function groq(messages, json = false) {
  if (!process.env.GROQ_API_KEY) {
    return fallbackLLM(messages, json);
  }
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages,
        temperature: 0.3,
        ...(json && { response_format: { type: 'json_object' } }),
      }),
    });
    const d = await r.json();
    if (!d.choices || !d.choices[0]?.message?.content) {
      console.warn('Groq API warning:', d.error?.message || d);
      return fallbackLLM(messages, json);
    }
    return d.choices[0].message.content;
  } catch (err) {
    console.warn('Groq network error, using smart fallback:', err.message);
    return fallbackLLM(messages, json);
  }
}
export async function embed(texts) {
  const r = await fetch(`${AI}/embed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts }) });
  return (await r.json()).vectors;
}
export async function stt(buf) {
  const fd = new FormData(); fd.append('file', new Blob([buf]), 'a.wav');
  return (await fetch(`${AI}/stt`, { method: 'POST', body: fd })).json();
}
export async function tts(text, lang = 'en') {
  const r = await fetch(`${AI}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang }) });
  return Buffer.from(await r.arrayBuffer());
}
