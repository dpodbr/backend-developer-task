import { assert } from 'sinon';
import { APIError } from 'src/utils/apiError';

describe('APIError.', () => {
  it('Should set correct error message.', () => {
    const apiError1: APIError = new APIError(100);
    assert.match(apiError1.message, 'Unknown error.');

    const apiError2: APIError = new APIError(404);
    assert.match(apiError2.message, 'Not found.');

    const message: string = 'Custom message.';
    const apiError3: APIError = new APIError(404, 'Custom message.');
    assert.match(apiError3.message, message);
  });
});
