import { Chunk } from './models.js';
import { embed } from './llm.js';

export function chunkText(text, size = 500, overlap = 80) {
  const words = text.split(/\s+/), out = [];
  for (let i = 0; i < words.length; i += size - overlap) out.push(words.slice(i, i + size).join(' '));
  return out.filter(Boolean);
}
export async function ingest(source, text) {
  const chunks = chunkText(text), vecs = await embed(chunks);
  await Chunk.insertMany(chunks.map((t, i) => ({ source, text: t, embedding: vecs[i] })));
  return chunks.length;
}
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0); // vectors are normalized
export async function retrieve(query, k = 4) {
  const [qv] = await embed([query]);
  try { // MongoDB Atlas Vector Search (index "vector_index", 384 dims, cosine)
    const r = await Chunk.aggregate([{ $vectorSearch: { index: 'vector_index', path: 'embedding', queryVector: qv, numCandidates: 100, limit: k } },
      { $project: { text: 1, source: 1, score: { $meta: 'vectorSearchScore' } } }]);
    if (r.length) return r;
  } catch (e) { /* fallback for local MongoDB without Atlas */ }
  const all = await Chunk.find().lean();
  return all.map(c => ({ ...c, score: cos(qv, c.embedding) })).sort((a, b) => b.score - a.score).slice(0, k);
}
