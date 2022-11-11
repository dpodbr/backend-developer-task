import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';
import { assert, mock, SinonStub, stub } from 'sinon';
import bcrypt from 'bcryptjs';
import { logger } from 'src/utils/logger';

const user: string = 'davidpo';
const password: string = 'davidpo';
const hashedPassword: string = '$2a$10$2Vd9BXcLw/rckaHOUmmWP.87hMzr3WeKXdJkxO5LFBgbA.lyfW2Ue';

describe('authHandlerMiddleware password generator and validator.', () => {
  it('Should generate salted and hashed password.', () => {
    const output: string = authHandlerMiddleware.hashPassword(password);
    assert.match(output !== '', true);
  });

  it('bcrypt should validate hashed and plain text password.', () => {
    assert.match(bcrypt.compareSync(password, hashedPassword), true);
  });

  it('bcrypt should reject hashed and random text password.', () => {
    assert.match(bcrypt.compareSync('randomtextpassword', hashedPassword), false);
  });
});

describe('authHandlerMiddleware authentication.', () => {
  let infoStub: SinonStub;

  before(() => {
    infoStub = stub(logger, 'info');
  });

  after(() => {
    infoStub.restore();
  });

  it('Should authenticate valid credentials.', async () => {
    (authHandlerMiddleware as any).credentials[user] = hashedPassword;
    const next: any = stub();
    const req: any = mock();
    req.headers = {
      authorization: 'Basic ZGF2aWRwbzpkYXZpZHBv'
    };
    const res: any = mock();

    await authHandlerMiddleware.authenticateCredentials(req, res, next);
    assert.called(next);
  });

  it('Should reject invalid credentials.', async () => {
    (authHandlerMiddleware as any).credentials[user] = hashedPassword;
    const next: any = stub();
    const req: any = mock();
    req.headers = {
      authorization: 'Basic ZGF2aWRwbzpkYXZpZA=='
    };
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await authHandlerMiddleware.authenticateCredentials(req, res, next);
    assert.notCalled(next);
    assert.calledWith(res.status, 401);
    assert.calledWith(statusReturn.json, { message: 'Wrong username / password.' });
  });

  it('Should reject missing authorization header.', async () => {
    (authHandlerMiddleware as any).credentials[user] = hashedPassword;
    const next: any = stub();
    const req: any = mock();
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await authHandlerMiddleware.authenticateCredentials(req, res, next);
    assert.notCalled(next);
    assert.calledWith(res.status, 401);
    assert.calledWith(statusReturn.json, { message: 'Missing auth header.' });
  });
});
