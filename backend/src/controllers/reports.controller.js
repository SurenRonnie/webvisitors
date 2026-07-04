import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Visit from '../models/Visit.js';

// Campaign/source attribution: which utm_source/campaign drives the highest
// *quality* traffic (avg lead score), not just volume.
export async function getAttributionReport(req, res) {
  const accountId = new mongoose.Types.ObjectId(req.accountId);

  const rows = await Session.aggregate([
    { $lookup: { from: 'visits', localField: 'visit', foreignField: '_id', as: 'visit' } },
    { $unwind: '$visit' },
    { $match: { 'visit.account': accountId } },
    {
      $group: {
        _id: {
          source: { $ifNull: ['$utmSource', 'direct/unknown'] },
          medium: { $ifNull: ['$utmMedium', 'none'] },
          campaign: { $ifNull: ['$utmCampaign', 'none'] },
        },
        sessions: { $sum: 1 },
        avgScore: { $avg: '$visit.score' },
        hotLeads: { $sum: { $cond: [{ $eq: ['$visit.tier', 'hot'] }, 1, 0] } },
      },
    },
    { $sort: { avgScore: -1 } },
  ]);

  res.json({
    rows: rows.map((r) => ({
      source: r._id.source,
      medium: r._id.medium,
      campaign: r._id.campaign,
      sessions: r.sessions,
      avgScore: Math.round(r.avgScore || 0),
      hotLeads: r.hotLeads,
    })),
  });
}

export async function getPipelineSummary(req, res) {
  const accountId = req.accountId;
  const [total, hot, warm, cold] = await Promise.all([
    Visit.countDocuments({ account: accountId }),
    Visit.countDocuments({ account: accountId, tier: 'hot' }),
    Visit.countDocuments({ account: accountId, tier: 'warm' }),
    Visit.countDocuments({ account: accountId, tier: 'cold' }),
  ]);
  res.json({ total, hot, warm, cold });
}
