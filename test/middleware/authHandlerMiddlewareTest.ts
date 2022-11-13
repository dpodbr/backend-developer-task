import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';
import { assert, mock, SinonStub, stub } from 'sinon';
import bcrypt from 'bcryptjs';
import { logger } from 'src/utils/logger';

const userId: string = '12345';
const username: string = 'davidpo';
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
    (authHandlerMiddleware as any).credentials[username] = {
      id: userId,
      password: hashedPassword
    };
  });

  after(() => {
    infoStub.restore();
  });

  it('Should authenticate valid credentials.', async () => {
    const next: any = stub();
    const req: any = mock();
    req.headers = {
      authorization: 'Basic ZGF2aWRwbzpkYXZpZHBv' // davidpo:davidpo
    };
    const res: any = mock();

    await authHandlerMiddleware.authenticateCredentials(req, res, next);
    assert.called(next);
    assert.match(req.userId, userId);
  });

  it('Should reject invalid password.', async () => {
    const next: any = stub();
    const req: any = mock();
    req.headers = {
      authorization: 'Basic ZGF2aWRwbzpkYXZpZA==' // davidpo:david
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
    assert.match(req.userId, undefined);
  });

  it('Should reject invalid user.', async () => {
    const next: any = stub();
    const req: any = mock();
    req.headers = {
      authorization: 'Basic ZGF2aWQ6ZGF2aWRwbw==' // david: davidpo
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
    assert.match(req.userId, undefined);
  });

  it('Should reject missing authorization header.', async () => {
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
    assert.match(req.userId, undefined);
  });

  it('Should pass missing authorization header if optionalAuth is true', async () => {
    const next: any = stub();
    const req: any = mock();
    const res: any = mock();

    await authHandlerMiddleware.authenticateCredentials(req, res, next, true);
    assert.called(next);
    assert.match(req.userId, undefined);
  });
});
