import { ObjectId } from 'mongodb';
import { assert, SinonStub, stub } from 'sinon';
import { Note } from 'src/models/note';
import { databaseService } from 'src/services/databaseService';
import { GetNotesResponse, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';

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

describe('NotesService getNotes.', () => {
  it('Should be sorted with correct sorting options.', async () => {
    const sortStub: SinonStub = stub();
    const getNotesCollectionStub: SinonStub = stub(databaseService, 'getNotesCollection');

    databaseService.getNotesCollection = getNotesCollectionStub;
    getNotesCollectionStub.returns({
      find: stub().returns({
        sort: sortStub.returns({
          toArray: stub().returns([note1, note2, note3])
        })
      })
    });

    const sorting: NotesSorting = {
      visibility: {
        sort: true,
        ascending: true
      },
      name: {
        sort: false,
        ascending: true
      }
    };

    await notesService.getNotes(userId1.toString(), undefined, undefined);
    assert.calledWith(sortStub, { visibility: 1, _id: 1 });
    sortStub.resetHistory();

    await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.calledWith(sortStub, { visibility: 1, _id: 1 });
    sortStub.resetHistory();

    sorting.visibility.ascending = false;
    await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.calledWith(sortStub, { visibility: -1, _id: 1 });
    sortStub.resetHistory();

    sorting.name.sort = true;
    sorting.name.ascending = true;
    await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.calledWith(sortStub, { visibility: -1, name: 1, _id: 1 });

    getNotesCollectionStub.restore();
  });

  it('Should paginate.', async () => {
    const getNotesCollectionStub: SinonStub = stub(databaseService, 'getNotesCollection');
    databaseService.getNotesCollection = getNotesCollectionStub;
    getNotesCollectionStub.returns({
      find: stub().returns({
        sort: stub().returns({
          toArray: stub().returns([note1, note2, note3])
        })
      })
    });

    const sorting: NotesSorting = {
      visibility: {
        sort: false,
        ascending: true
      },
      name: {
        sort: true,
        ascending: true
      }
    };
    const pagination: NotesPagination = {
      page: 1,
      limit: 1
    };

    const response1: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination, sorting);
    assert.match(response1.notes[0], note1);
    assert.match(response1.notes.length, 1);
    assert.match(response1.page, 1);
    assert.match(response1.totalPages, 3);

    pagination.page = 2;
    const response2: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination, sorting);
    assert.match(response2.notes[0], note2);
    assert.match(response2.notes.length, 1);
    assert.match(response2.page, 2);
    assert.match(response2.totalPages, 3);

    pagination.page = 1;
    pagination.limit = 2;
    const response3: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination, sorting);
    assert.match(response3.notes.length, 2);
    assert.match(response3.page, 1);
    assert.match(response3.totalPages, 2);

    pagination.page = 3;
    const response4: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination, sorting);
    // Returns 0 length array if page > totalPages.
    assert.match(response4.notes.length, 0);

    getNotesCollectionStub.restore();
  });
});
