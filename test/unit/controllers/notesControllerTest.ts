import { ObjectId } from 'mongodb';
import { assert, mock, SinonStub, stub } from 'sinon';
import { notesController } from 'src/controllers/notesController';
import { NotesFilter, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';
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
        sortVisibility: 'asc',
        sortName: 'desc'
      }
    };
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await notesController.getNotes(req, res);

    const sorting: NotesSorting = getNotesStub.getCall(0).args[2];
    assert.match(sorting.visibility, 1);
    assert.match(sorting.name, -1);
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

  it('Should set valid filter request.', async () => {
    const folderId: string = '123456789123';
    const visibility: string = '1';
    const text: string = 'text';
    const req: any = {
      query: {
        filterFolderId: folderId,
        filterVisibility: visibility,
        filterText: text
      },
      userId: new ObjectId()
    };
    const res: any = mock();
    const statusReturn: any = {
      json: stub()
    };
    res.status = stub().returns(statusReturn);

    await notesController.getNotes(req, res);

    const filter: NotesFilter = getNotesStub.getCall(0).args[3];
    assert.match(filter.folderId, folderId);
    assert.match(filter.visibility, Number(visibility));
    assert.match(filter.text, text);
  });

  it('Should throw error for invalid sorting direction option.', async () => {
    const req: any = {
      query: {
        sortVisibility: 'invalid sorting direction option'
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

  it('Should throw error for filtering with invalid folder id.', async () => {
    const req: any = {
      query: {
        filterFolderId: 'Invalid folder id'
      },
      userId: new ObjectId()
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    const error: APIError = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid folderId filter.');
  });

  it('Should throw error for filtering by folder when unauthenticated.', async () => {
    const req: any = {
      query: {
        filterFolderId: '123456789123'
      }
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    const error: APIError = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 403);
    assert.match(error.message, 'Unauthenticated users cannot filter by folders.');
  });

  it('Should throw error for filtering with invalid visibility option.', async () => {
    const req: any = {
      query: {
        filterVisibility: 'Invalid visibility'
      }
    };
    const res: any = mock();

    await notesController.getNotes(req, res);

    let error: APIError = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid visibility filter.');
    handleErrorStub.resetHistory();

    req.query.filterVisibility = 2;
    await notesController.getNotes(req, res);

    error = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid visibility filter.');
    handleErrorStub.resetHistory();

    req.query.filterVisibility = -1;
    await notesController.getNotes(req, res);

    error = handleErrorStub.getCall(0).args[1] as APIError;
    assert.notCalled(getNotesStub);
    assert.match(error.code, 400);
    assert.match(error.message, 'Invalid visibility filter.');
  });
});
