// Adapter interface every CRM connector implements. Real OAuth token exchange and
// field-mapped upserts would live in `exchangeCode`/`upsertCompany`; today only the
// mock adapter is wired up since no CRM developer credentials were supplied.
export class CrmAdapter {
  get providerName() {
    throw new Error('providerName getter not implemented');
  }

  /** @returns {Promise<{accessToken:string, refreshToken?:string, expiresAt?:Date}>} */
  async exchangeCode(code) {
    throw new Error('exchangeCode() not implemented');
  }

  /** @returns {Promise<{externalId:string}>} */
  async upsertCompany({ credentials, company, visit, fieldMapping }) {
    throw new Error('upsertCompany() not implemented');
  }
}
