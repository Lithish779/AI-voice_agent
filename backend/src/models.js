import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const Call = model('Call', new Schema({
  callId: { type: String, index: true }, caller: String, language: String,
  startedAt: { type: Date, default: Date.now }, endedAt: Date, status: { type: String, default: 'active' },
  turns: [{ role: String, text: String, intent: String, sentiment: String, ts: { type: Date, default: Date.now } }],
  lead: { name: String, need: String, budget: String, timeline: String, score: Number },
  sentiment: String, summary: String, nextAction: String, escalated: Boolean, appointmentId: String,
}));
export const Chunk = model('Chunk', new Schema({ source: String, text: String, embedding: [Number] }));
export const Appointment = model('Appointment', new Schema({ callId: String, name: String, phone: String, slot: Date, notes: String, status: { type: String, default: 'confirmed' } }, { timestamps: true }));
export const Customer = model('Customer', new Schema({ phone: String, name: String, email: String, orderStatus: String, plan: String, leadScore: Number, notes: String }, { timestamps: true }));
