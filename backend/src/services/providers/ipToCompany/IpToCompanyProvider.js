// Adapter interface: any IP-to-company provider must implement `resolve(ip)` and
// return this shape (or null if the IP can't be resolved to a business).
export class IpToCompanyProvider {
  /**
   * @param {string} ip
   * @returns {Promise<{domain:string,name:string,industry?:string,employeeCount?:number,
   *   estimatedRevenue?:string,hqLocation?:string,country?:string,isBusiness:boolean} | null>}
   */
  async resolve(ip) {
    throw new Error('resolve() not implemented');
  }
}
