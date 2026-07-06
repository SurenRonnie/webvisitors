// Adapter interface: fills in the firmographic/social fields that IP-to-company
// resolution can't provide (ASN lookups only give you org name + domain).
export class CompanyEnrichmentProvider {
  /**
   * @param {{domain:string}} params
   * @returns {Promise<{name?:string, industry?:string, socialLinks?:{linkedinUrl?:string,
   *   twitterUrl?:string, facebookUrl?:string, instagramUrl?:string, youtubeUrl?:string},
   *   techStack?:string[], logoUrl?:string} | null>}
   */
  async enrich(params) {
    throw new Error('enrich() not implemented');
  }
}
