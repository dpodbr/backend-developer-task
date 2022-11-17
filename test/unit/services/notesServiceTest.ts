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
  visibility: 1
};

describe('NotesService getNotes.', () => {
  let getNotesCollectionStub: SinonStub;

  before(() => {
    getNotesCollectionStub = stub(databaseService, 'getNotesCollection');
    databaseService.getNotesCollection = getNotesCollectionStub;
    getNotesCollectionStub.returns({
      find: stub().returns({
        toArray: stub().returns([note1, note2, note3])
      })
    });
  });

  after(() => {
    getNotesCollectionStub.restore();
  });

  it('Should filter out duplicated private / public notes.', async () => {
    const response: GetNotesResponse = await notesService.getNotes(userId1.toString());

    // Second call to getNotesCollection doesn't double the notes in the list - only the original 3 remain.
    assert.match(response.notes.length, 3);
  });

  it('Should sort notes by sorting options in correct order.', async () => {
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

    const response1: GetNotesResponse = await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.match(response1.notes[0].visibility, 0);
    assert.match(response1.notes[1].visibility, 1);

    sorting.visibility.ascending = false;
    const response2: GetNotesResponse = await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.match(response2.notes[0].visibility, 1);
    assert.match(response2.notes[1].visibility, 1);

    sorting.visibility.sort = false;
    sorting.name.sort = true;
    const response3: GetNotesResponse = await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.match(response3.notes[0], note1);
    assert.match(response3.notes[1], note2);

    sorting.name.ascending = false;
    const response4: GetNotesResponse = await notesService.getNotes(userId1.toString(), undefined, sorting);
    assert.match(response4.notes[0], note3);
    assert.match(response4.notes[1], note2);
  });

  it('Should paginate.', async () => {
    const pagination: NotesPagination = {
      page: 1,
      limit: 1
    };

    const response1: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination);
    assert.match(response1.notes[0], note1);
    assert.match(response1.notes.length, 1);
    assert.match(response1.page, 1);
    assert.match(response1.totalPages, 3);

    pagination.page = 2;
    const response2: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination);
    assert.match(response2.notes[0], note2);
    assert.match(response2.notes.length, 1);
    assert.match(response2.page, 2);
    assert.match(response2.totalPages, 3);

    pagination.page = 1;
    pagination.limit = 2;
    const response3: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination);
    assert.match(response3.notes.length, 2);
    assert.match(response3.page, 1);
    assert.match(response3.totalPages, 2);

    pagination.page = 3;
    const response4: GetNotesResponse = await notesService.getNotes(userId1.toString(), pagination);
    // Returns 0 length array if page > totalPages.
    assert.match(response4.notes.length, 0);
  });
});

