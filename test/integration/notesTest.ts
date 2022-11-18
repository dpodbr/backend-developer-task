import { ObjectId } from 'mongodb';
import { assert } from 'sinon';
import * as request from 'superagent';
import { apiUrl, deleteHelper, get, post, put } from './utils/helpers';

describe('Notes test.', () => {
  let createdNoteId: string;
  let createdFolderId: string;

  it('Should create a new note.', async () => {
    let response: any = await post('/folders', {
      name: 'Integration test folder'
    });
    const folder: any = response.body;
    assert.match(response.status, 201);
    assert.match(folder._id !== undefined, true);
    createdFolderId = folder._id;

    response = await post(`/notes/${createdFolderId}`, {
      name: 'Integration test note'
    });
    let note: any = response.body;
    assert.match(response.status, 201);
    assert.match(note._id !== undefined, true);
    createdNoteId = note._id;

    response = await get(`/notes/${createdNoteId}`);
    note = response.body;
    assert.match(response.status, 200);
    assert.match(note._id, createdNoteId);
  });

  it('Should return created user note.', async () => {
    const response: any = await get('/notes');
    const notes = response.body.notes;
    assert.match(notes.some((note: any) => note._id === createdNoteId), true);
  });

  it('Should return only public user notes if unauthorized.', async () => {
    const response: any = await request
      .get(`${apiUrl}/notes`);

    const notes = response.body.notes;
    assert.match(notes.every((note: any) => note.visibility === 1), true);
  });

  it('Should return 404 for getting private notes if unauthorized.', async () => {
    const response: any = await request
      .get(`${apiUrl}/notes/${createdNoteId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for getting a non existing note.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await get(`/notes/${randomId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for getting another users private note.', async () => {
    const response: any = await request
      .get(`${apiUrl}/notes/${createdNoteId}`)
      .auth('nezaga', 'nezaga')
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should update note.', async () => {
    const updateNoteName: string = 'Updated integration test note';
    const response: any = await put(`/notes/${createdNoteId}`, {
      name: updateNoteName
    });
    const note: any = response.body;
    assert.match(note.name, updateNoteName);
  });

  it('Should return 404 for updating a non existing note.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await put(`/notes/${randomId}`, { name: 'Note update will fail' })
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for updating another users note.', async () => {
    const response: any = await request
      .put(`${apiUrl}/notes/${createdNoteId}`)
      .auth('nezaga', 'nezaga')
      .send({ name: 'Note update will fail' })
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 400 for bad request parameters.', async () => {
    const response: any = await put(`/notes/${createdNoteId}`, { name: null })
      .catch((res) => { assert.match(res.status, 400); });

    assert.match(response, undefined);
  });

  it('Should return 404 for deleting a non existing note.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await deleteHelper(`/notes/${randomId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for deleting another users note.', async () => {
    const response: any = await request
      .delete(`${apiUrl}/notes/${createdNoteId}`)
      .auth('nezaga', 'nezaga')
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should create and delete note.', async () => {
    let response: any = await post(`/notes/${createdFolderId}`, {
      name: 'Integration test note 2'
    });

    assert.match(response.status, 201);
    const noteId: string = response.body._id;

    response = await get(`/notes/${noteId}`);
    assert.match(response.status, 200);

    response = await deleteHelper(`/notes/${noteId}`);
    assert.match(response.status, 204);

    response = undefined;
    response = await get(`/notes/${noteId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should delete folder and note.', async () => {
    let response: any = await deleteHelper(`/folders/${createdFolderId}`);
    assert.match(response.status, 204);

    response = undefined;
    response = await get(`/notes/${createdNoteId}`)
      .catch((res) => {
        assert.match(res.status, 404);
      });

    assert.match(response, undefined);
  });
});
