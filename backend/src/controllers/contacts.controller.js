import Contact from '../models/Contact.js';
import Company from '../models/Company.js';
import { getContactProvider } from '../services/providers/contactEnrichment/index.js';

export async function listContactsForCompany(req, res) {
  const contacts = await Contact.find({ company: req.params.companyId });
  res.json({ contacts });
}

// Manual "Contact Finder" refresh — re-queries the enrichment provider on demand
// (e.g. the sales rep wants a different title than what auto-enrichment fetched).
export async function refreshContacts(req, res) {
  const company = await Company.findById(req.params.companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const { titles } = req.body;
  const provider = getContactProvider();
  const found = await provider.findContacts({ domain: company.domain, titles });

  const source = provider.constructor.name.toLowerCase().includes('owndataset') ? 'own_dataset' : 'mock';
  const created = await Contact.insertMany(found.map((c) => ({ ...c, company: company._id, source })));

  res.json({ contacts: created });
}
