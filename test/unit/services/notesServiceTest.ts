import { ObjectId } from 'mongodb';
import { assert, SinonStub, stub } from 'sinon';
import { Folder } from 'src/models/folder';
import { Note } from 'src/models/note';
import { databaseService } from 'src/services/databaseService';
import { foldersService } from 'src/services/foldersService';
import { GetNotesResponse, NotesFilter, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';

const userId1: ObjectId = new ObjectId();
const userId2: ObjectId = new ObjectId();
const note1: Note = {
  _id: new ObjectId(),
  items: [],
  name: 'Note 1',
  ownerUserId: userId1,
  text: '',
  type: 0,
  visibility: 0
};
const note2: Note = {
  _id: new ObjectId(),
  items: [],
  name: 'Note 2',
  ownerUserId: userId2,
  text: '',
  type: 0,
  visibility: 1
};
const note3: Note = {
  _id: new ObjectId(),
  items: [],
  name: 'Note 3',
  ownerUserId: userId2,
  text: '',
  type: 0,
  visibility: 0
};
const notes: Note[] = [note1, note2, note3];

describe('NotesService getNotes.', () => {
  it('Should be sorted with correct sorting options.', async () => {
    const sortStub: SinonStub = stub();
    const getNotesCollectionStub: SinonStub = stub(databaseService, 'getNotesCollection');
    databaseService.getNotesCollection = getNotesCollectionStub;

    getNotesCollectionStub.returns({
      countDocuments: stub().returns(notes.length),
      find: stub().returns({
        sort: sortStub.returns({
          skip: stub().returns({
            limit: stub().returns({
              toArray: stub().returns(notes)
            })
          })
        })
      })
    });

    const sorting: NotesSorting = {
      visibility: 1,
      name: undefined
    };

    await notesService.getNotes(userId1, undefined, undefined);
    assert.calledWith(sortStub, { visibility: 1, _id: 1 });
    sortStub.resetHistory();

    await notesService.getNotes(userId1, undefined, sorting);
    assert.calledWith(sortStub, { visibility: 1, _id: 1 });
    sortStub.resetHistory();

    sorting.visibility = -1;
    await notesService.getNotes(userId1, undefined, sorting);
    assert.calledWith(sortStub, { visibility: -1, _id: 1 });
    sortStub.resetHistory();

    sorting.name = 1;
    await notesService.getNotes(userId1, undefined, sorting);
    assert.calledWith(sortStub, { visibility: -1, name: 1, _id: 1 });

    getNotesCollectionStub.restore();
  });

  it('Should paginate.', async () => {
    const skipStub: SinonStub = stub();
    const limitStub: SinonStub = stub();
    const getNotesCollectionStub: SinonStub = stub(databaseService, 'getNotesCollection');
    databaseService.getNotesCollection = getNotesCollectionStub;

    getNotesCollectionStub.returns({
      countDocuments: stub().returns(notes.length),
      find: stub().returns({
        sort: stub().returns({
          skip: skipStub.returns({
            limit: limitStub.returns({
              toArray: stub().returns(notes)
            })
          })
        })
      })
    });

    const pagination: NotesPagination = {
      page: 1,
      limit: 1
    };

    const response1: GetNotesResponse = await notesService.getNotes(userId1, pagination);
    assert.calledWith(skipStub, 0);
    assert.calledWith(limitStub, 1);
    assert.match(response1.page, 1);
    assert.match(response1.totalPages, 3);
    skipStub.resetHistory();
    limitStub.resetHistory();

    pagination.page = 2;
    const response2: GetNotesResponse = await notesService.getNotes(userId1, pagination);
    assert.calledWith(skipStub, 1);
    assert.calledWith(limitStub, 1);
    assert.match(response2.page, 2);
    assert.match(response2.totalPages, 3);
    skipStub.resetHistory();
    limitStub.resetHistory();

    pagination.page = 1;
    pagination.limit = 2;
    const response3: GetNotesResponse = await notesService.getNotes(userId1, pagination);
    assert.calledWith(skipStub, 0);
    assert.calledWith(limitStub, 2);
    assert.match(response3.page, 1);
    assert.match(response3.totalPages, 2);
    skipStub.resetHistory();
    limitStub.resetHistory();

    pagination.page = 3;
    const response4: GetNotesResponse = await notesService.getNotes(userId1, pagination);
    assert.calledWith(skipStub, 4);
    assert.calledWith(limitStub, 2);
    assert.match(response4.page, 3);
    assert.match(response4.totalPages, 2);
    skipStub.resetHistory();
    limitStub.resetHistory();

    getNotesCollectionStub.restore();
  });

  it('Should be filtered with correct filtering options.', async () => {
    const findStub: SinonStub = stub();
    const getNotesCollectionStub: SinonStub = stub(databaseService, 'getNotesCollection');
    databaseService.getNotesCollection = getNotesCollectionStub;

    getNotesCollectionStub.returns({
      countDocuments: stub().returns(notes.length),
      find: findStub.returns({
        sort: stub().returns({
          skip: stub().returns({
            limit: stub().returns({
              toArray: stub().returns(notes)
            })
          })
        })
      })
    });

    const folder: Folder = {
      _id: new ObjectId(),
      name: 'New folder',
      notes: [note1._id]
    };
    const getFolderStub: SinonStub = stub(foldersService, 'getFolder');
    getFolderStub.returns(folder);

    const filter: NotesFilter = {
      folderId: '123456789123',
      visibility: 1,
      text: 'text'
    };

    const query: { $and: any[] } = {
      $and: [
        {
          $or: [
            { ownerUserId: userId1 },
            { visibility: 1 }
          ]
        },
        {
          _id: {
            $in: folder.notes
          }
        },
        { visibility: filter.visibility },
        {
          text: {
            $regex: filter.text,
            $options: 'i'
          }
        }
      ]
    };

    await notesService.getNotes(userId1, undefined, undefined, filter);
    assert.calledWith(findStub, query);

    getNotesCollectionStub.restore();
    getFolderStub.restore();
  });
});
