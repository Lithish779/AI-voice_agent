import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Call, Chunk, Appointment, Customer } from './models.js';
import { ingest } from './rag.js';
import { handleTurn, finalize } from './brain.js';
import { startARI } from './ari.js';
import { stt, tts } from './llm.js';

try { process.loadEnvFile(); } catch {}
try { process.loadEnvFile('../.env'); } catch {}

const app = express(); app.use(cors(), express.json({ limit: '5mb' }));
await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voiceagent');

if ((await Customer.countDocuments()) <= 1) {
  await Customer.deleteMany({});
  await Customer.insertMany([
    { phone: 'web', name: 'Demo Web User', email: 'web@acmesolar.com', orderStatus: 'Shipped, arriving Friday', plan: 'Pro', leadScore: 90, notes: 'Interested in battery expansion' },
    { phone: '+15552345678', name: 'Alex Rivera', email: 'alex.rivera@techcorp.io', orderStatus: 'Delivered, awaiting permit', plan: 'Enterprise', leadScore: 95, notes: 'Commercial 50kW solar array' },
    { phone: '+15558765432', name: 'Sarah Chen', email: 'sarah.chen@gmail.com', orderStatus: 'Inspection scheduled Dec 2', plan: 'Pro', leadScore: 82, notes: 'Residential rooftop 10kW' },
    { phone: '+15553456789', name: 'Marcus Vance', email: 'marcus.v@northstar.org', orderStatus: 'Design phase approved', plan: 'Basic', leadScore: 65, notes: 'Standard 5kW package' },
  ]);
}

if (!(await Appointment.countDocuments())) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(14, 0, 0, 0);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 3); nextWeek.setHours(16, 30, 0, 0);
  await Appointment.insertMany([
    { callId: 'demo-call-1', name: 'Alex Rivera', phone: '+15552345678', slot: tomorrow, notes: 'Commercial solar assessment & site survey', status: 'confirmed' },
    { callId: 'web-init', name: 'Sarah Chen', phone: '+15558765432', slot: nextWeek, notes: 'Residential battery storage walkthrough', status: 'confirmed' },
  ]);
}

app.get('/api/calls', async (req, res) => {
  const q = req.query.q ? { 'turns.text': new RegExp(req.query.q, 'i') } : {};
  res.json(await Call.find(q).sort({ startedAt: -1 }).limit(100).select('-turns').lean());
});
app.get('/api/calls/:id', async (req, res) => res.json(await Call.findOne({ callId: req.params.id }).lean()));
app.get('/api/analytics', async (_, res) => {
  const [total, bySent, byIntent, avgScore, booked] = await Promise.all([
    Call.countDocuments(),
    Call.aggregate([{ $group: { _id: '$sentiment', n: { $sum: 1 } } }]),
    Call.aggregate([{ $unwind: '$turns' }, { $match: { 'turns.intent': { $ne: null } } }, { $group: { _id: '$turns.intent', n: { $sum: 1 } } }]),
    Call.aggregate([{ $group: { _id: null, s: { $avg: '$lead.score' } } }]),
    Appointment.countDocuments()]);
  res.json({ total, bySent, byIntent, avgLeadScore: Math.round(avgScore[0]?.s || 0), appointments: booked });
});
app.get('/api/kb', async (_, res) => res.json(await Chunk.aggregate([{ $group: { _id: '$source', chunks: { $sum: 1 } } }])));
app.post('/api/kb', async (req, res) => res.json({ chunks: await ingest(req.body.source || 'manual', req.body.text) }));
app.delete('/api/kb/:source', async (req, res) => res.json(await Chunk.deleteMany({ source: req.params.source })));

// Appointments CRUD & Conflict Checking
app.get('/api/appointments', async (_, res) => res.json(await Appointment.find().sort({ slot: 1 }).lean()));
app.post('/api/appointments', async (req, res) => {
  try {
    const { slot, name, phone, notes, callId } = req.body;
    if (!slot) return res.status(400).json({ error: 'Slot date and time are required' });
    const slotDate = new Date(slot);
    const clash = await Appointment.findOne({ slot: slotDate, status: { $ne: 'cancelled' } });
    if (clash) return res.status(409).json({ error: 'Selected time slot is already booked. Please choose another time.' });
    const appt = await Appointment.create({ slot: slotDate, name: name || 'Direct Booking', phone: phone || 'N/A', notes, callId: callId || 'dashboard', status: 'confirmed' });
    res.json(appt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.patch('/api/appointments/:id', async (req, res) => {
  res.json(await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
app.delete('/api/appointments/:id', async (req, res) => {
  res.json(await Appointment.findByIdAndDelete(req.params.id));
});

// Customers (CRM) CRUD
app.get('/api/customers', async (req, res) => {
  const q = req.query.q ? { $or: [{ name: new RegExp(req.query.q, 'i') }, { phone: new RegExp(req.query.q, 'i') }, { plan: new RegExp(req.query.q, 'i') }] } : {};
  res.json(await Customer.find(q).sort({ createdAt: -1 }).lean());
});
app.post('/api/customers', async (req, res) => {
  res.json(await Customer.create(req.body));
});
app.put('/api/customers/:id', async (req, res) => {
  res.json(await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
app.delete('/api/customers/:id', async (req, res) => {
  res.json(await Customer.findByIdAndDelete(req.params.id));
});
// Voice Audio endpoints for direct browser calling
app.post('/api/voice/tts', async (req, res) => {
  try {
    const audioBuf = await tts(req.body.text, req.body.lang || 'en');
    res.set({ 'Content-Type': 'audio/wav', 'Content-Length': audioBuf.length });
    res.send(audioBuf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/voice/stt', express.raw({ type: () => true, limit: '15mb' }), async (req, res) => {
  try {
    const result = await stt(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Simulation of a call — same brain as the phone path
app.post('/api/chat', async (req, res) => {
  if (req.body.name || req.body.budget) {
    const initSet = {};
    if (req.body.name) { initSet['lead.name'] = req.body.name; initSet.caller = req.body.name; }
    if (req.body.budget) initSet['lead.budget'] = req.body.budget;
    await Call.updateOne({ callId: req.body.callId }, { $set: initSet }, { upsert: true });
  }
  res.json(await handleTurn(req.body.callId, req.body.text, req.body.name || 'web'));
});
app.post('/api/chat/end', async (req, res) => { await finalize(req.body.callId); res.json(await Call.findOne({ callId: req.body.callId }).lean()); });

app.listen(4000, () => console.log('API on :4000'));
startARI().catch(e => console.error('ARI not available (text mode still works):', e.message));
