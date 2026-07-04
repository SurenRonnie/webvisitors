import mongoose from 'mongoose';
import Visit from '../models/Visit.js';
import Company from '../models/Company.js';
import Session from '../models/Session.js';
import PageView from '../models/PageView.js';
import Contact from '../models/Contact.js';

// The "Lead Feed": one row per company visit, filterable/sortable across the
// Visit + joined Company fields (score, industry, size, country, first-vs-returning, pages).
export async function listLeadFeed(req, res) {
  const {
    minScore, tier, industry, country, minEmployees, maxEmployees,
    visitType, page: pagePath, websiteId, sortBy = 'score', sortDir = 'desc',
    limit = 50, skip = 0,
  } = req.query;

  const match = { account: new mongoose.Types.ObjectId(req.accountId) };
  if (minScore) match.score = { $gte: Number(minScore) };
  if (tier) match.tier = tier;
  if (websiteId) match.website = new mongoose.Types.ObjectId(websiteId);
  if (pagePath) match.highIntentPagesViewed = pagePath;
  if (visitType === 'first') match.sessionCount = 1;
  if (visitType === 'returning') match.sessionCount = { $gt: 1 };

  const companyMatch = {};
  if (industry) companyMatch['company.industry'] = industry;
  if (country) companyMatch['company.country'] = country;
  if (minEmployees || maxEmployees) {
    companyMatch['company.employeeCount'] = {
      ...(minEmployees ? { $gte: Number(minEmployees) } : {}),
      ...(maxEmployees ? { $lte: Number(maxEmployees) } : {}),
    };
  }

  const sortField = ['score', 'lastSeenAt', 'firstSeenAt', 'pageViewCount'].includes(sortBy) ? sortBy : 'score';
  const sortStage = { [sortField]: sortDir === 'asc' ? 1 : -1 };

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'companies', localField: 'company', foreignField: '_id', as: 'company' } },
    { $unwind: '$company' },
    ...(Object.keys(companyMatch).length ? [{ $match: companyMatch }] : []),
    { $sort: sortStage },
    { $skip: Number(skip) },
    { $limit: Math.min(Number(limit), 200) },
  ];

  const visits = await Visit.aggregate(pipeline);
  res.json({ visits });
}

export async function getCompanyProfile(req, res) {
  const visit = await Visit.findOne({ _id: req.params.visitId, account: req.accountId }).populate('company');
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const sessions = await Session.find({ visit: visit._id }).sort({ startedAt: -1 }).limit(50);
  const pageViews = await PageView.find({ session: { $in: sessions.map((s) => s._id) } }).sort({ viewedAt: 1 });
  const contacts = await Contact.find({ company: visit.company._id });

  // Heatmap of interest: count of pageviews per path.
  const pageHeatmap = pageViews.reduce((acc, pv) => {
    acc[pv.path] = (acc[pv.path] || 0) + 1;
    return acc;
  }, {});

  res.json({ visit, sessions, pageViews, contacts, pageHeatmap });
}

export async function addNote(req, res) {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body is required' });
  const visit = await Visit.findOneAndUpdate(
    { _id: req.params.visitId, account: req.accountId },
    { $push: { notes: { author: req.user._id, body } } },
    { new: true }
  );
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  res.json({ visit });
}

export async function updateTags(req, res) {
  const { tags } = req.body;
  if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' });
  const visit = await Visit.findOneAndUpdate(
    { _id: req.params.visitId, account: req.accountId },
    { $set: { tags } },
    { new: true }
  );
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  res.json({ visit });
}
