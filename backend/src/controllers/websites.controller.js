import Website from '../models/Website.js';
import Session from '../models/Session.js';

export async function listWebsites(req, res) {
  const websites = await Website.find(req.scoped()).sort({ createdAt: -1 });
  res.json({ websites });
}

export async function createWebsite(req, res) {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain is required' });
  const website = await Website.create({ account: req.accountId, domain });
  res.status(201).json({ website });
}

export async function getInstallStatus(req, res) {
  const website = await Website.findOne(req.scoped({ _id: req.params.id }));
  if (!website) return res.status(404).json({ error: 'Website not found' });

  const hasTraffic = await Session.exists({ website: website._id });
  if (hasTraffic && !website.installVerifiedAt) {
    website.installVerifiedAt = new Date();
    await website.save();
  }

  res.json({ installed: Boolean(hasTraffic), trackingId: website.trackingId });
}
