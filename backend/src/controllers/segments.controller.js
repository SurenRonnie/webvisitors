import Segment from '../models/Segment.js';

export async function listSegments(req, res) {
  const segments = await Segment.find(req.scoped()).sort({ createdAt: -1 });
  res.json({ segments });
}

export async function createSegment(req, res) {
  const { name, filter } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const segment = await Segment.create({ account: req.accountId, owner: req.user._id, name, filter: filter || {} });
  res.status(201).json({ segment });
}

export async function updateSegment(req, res) {
  const { name, filter } = req.body;
  const segment = await Segment.findOneAndUpdate(
    { _id: req.params.id, account: req.accountId },
    { ...(name ? { name } : {}), ...(filter ? { filter } : {}) },
    { new: true }
  );
  if (!segment) return res.status(404).json({ error: 'Segment not found' });
  res.json({ segment });
}

export async function deleteSegment(req, res) {
  await Segment.deleteOne({ _id: req.params.id, account: req.accountId });
  res.status(204).end();
}
