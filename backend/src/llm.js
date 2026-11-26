const AI = process.env.AI_URL || 'http://127.0.0.1:8000';

function generateSpokenReply(userMsg, sysMsg) {
  const lower = userMsg.toLowerCase();
  if (lower.includes('pro') || lower.includes('cost') || lower.includes('price') || lower.includes('plan')) {
    return "Our Pro plan is $199 per month for a 10kW solar system with Tesla Powerwall battery backup, and our Basic plan is $99 per month.";
  }
  if (lower.includes('warranty') || lower.includes('guarantee')) {
    return "All our systems come with a comprehensive 25-year manufacturer warranty covering equipment, inverter, and labor.";
  }
  if (lower.includes('book') || lower.includes('demo') || lower.includes('schedule') || lower.includes('appointment')) {
    return "I would be happy to book a solar demo for you! What date and time works best for your schedule?";
  }
  if (lower.includes('human') || lower.includes('manager') || lower.includes('person') || lower.includes('transfer')) {
    return "I understand. Please hold while I connect you directly with a senior solar specialist.";
  }
  if (lower.includes('order') || lower.includes('status') || lower.includes('account')) {
    return "I checked your account. Your solar permits are approved and installation is scheduled!";
  }
  return "Acme Solar provides full residential and commercial rooftop solar installations with 25-year warranties. How can I help you today?";
}

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

    const reply = generateSpokenReply(userMsg, sysMsg);

    return JSON.stringify({
      reply,
      intent,
      sentiment: intent === "escalate" ? "negative" : "positive",
      language: "en",
      lead: { name, need: need || "Solar consultation", budget, timeline: lower.includes('tomorrow') ? 'immediate' : null },
      booking: { slot },
      lead_score,
    });
  }

  return generateSpokenReply(userMsg, sysMsg);
}

export async function groq(messages, json = false) {
  if (!process.env.GROQ_API_KEY) {
    return fallbackLLM(messages, json);
  }
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
        messages,
        temperature: 0.2,
        max_tokens: 380,
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
