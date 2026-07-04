// Adapter interface: any person/contact enrichment provider implements `findContacts`.
export class ContactProvider {
  /**
   * @param {{domain:string, titles?:string[]}} params
   * @returns {Promise<Array<{name:string,title:string,email?:string,emailConfidence?:number,linkedinUrl?:string}>>}
   */
  async findContacts(params) {
    throw new Error('findContacts() not implemented');
  }
}
