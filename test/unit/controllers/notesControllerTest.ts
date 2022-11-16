import { assert, mock, SinonStub, stub } from 'sinon';
import { notesController } from 'src/controllers/notesController';
import { NotesPagination, notesService, NotesSorting } from 'src/services/notesService';
import { APIError } from 'src/utils/apiError';
import * as errorHandler from 'src/utils/errorHandler';

describe('NotesController getNotes.', () => {
  let getNotesStub: SinonStub;
  let handleErrorStub: SinonStub;

  beforeEach(() => {
    getNotesStub = stub(notesService, 'getNotes');
    handleErrorStub = stub(errorHandler, 'handleError');
  });

  afterEach(() => {
    getNotesStub.restore();
    handleErrorStub.restore();
  });

  it('Should set valid sorting request.', async () => {
    const req: any = {
      query: {
        sort: 'visibility',
        dir: 'asc'
      }
    };
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await notesController.getNotes(req, res);

    const sorting: NotesSorting = getNotesStub.getCall(0).args[2];
    assert.match(sorting.visibility.sort, true);
    assert.match(sorting.visibility.ascending, true);
  });

  it('Should set valid pagination request.', async () => {
    const req: any = {
      query: {
        page: '1',
        limit: '2'
      }
    };
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await notesController.getNotes(req, res);

    const pagination: NotesPagination = getNotesStub.getCall(0).args[1];
    assert.match(pagination.page, 1);
    assert.match(pagination.limit, 2);
  });

  it('Should throw error for invalid sorting option.', async () => {
    const req: any = {
      query: {
        sort: 'invalid sorting option',
        dir: 'asc'
      }
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    const error: APIError = handleErrorStub.getCall(0).args[1] as APIError;

    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid sorting option.');
  });

  it('Should throw error for invalid sorting direction option.', async () => {
    const req: any = {
      query: {
        sort: 'name',
        dir: 'invalid direction option'
      }
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    const error: APIError = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid sorting direction option.');
  });

  it('Should throw error for invalid pagination values.', async () => {
    const req: any = {
      query: {
        page: 'invalid option',
        limit: 0
      }
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    const error: APIError = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid pagination values.');
  });
});
