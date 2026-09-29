import nock from 'nock';

const PARTNER_URL = 'http://partner.test';

export function mockPartnerSuccess(ref = 'ptr_123') {
  return nock(PARTNER_URL).post('/sepa').reply(201, { id: ref });
}

export function mockPartnerFailure(status = 503) {
  return nock(PARTNER_URL).post('/sepa').reply(status, { error: 'partner unavailable' });
}
