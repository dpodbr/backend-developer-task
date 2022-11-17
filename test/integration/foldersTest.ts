import { ObjectId } from 'mongodb';
import { assert } from 'sinon';
import * as request from 'superagent';
import { apiUrl, deleteHelper, get, post, put } from './utils/helpers';

describe('Folders CRUD.', () => {
  let createdFolderId: string;

  it('Should create a new folder.', async () => {
    const resPost: any = await post('/folders', {
      name: 'Integration test folder',
      notes: []
    });
    let folder: any = resPost.body;
    assert.match(resPost.status, 201);
    assert.match(folder._id !== undefined, true);
    createdFolderId = folder._id;

    const resGet: any = await get(`/folders/${createdFolderId}`);
    folder = resGet.body;
    assert.match(resGet.status, 200);
    assert.match(folder._id, createdFolderId);
  });

  it('Should return created user folders.', async () => {
    const response: any = await get('/folders');
    assert.match(response.body.some((folder: any) => folder._id === createdFolderId), true);
  });

  it('Should return 401 for getting folders if unauthorized.', async () => {
    const response: any = await request
      .get(`${apiUrl}/folders`)
      .catch((res) => { assert.match(res.status, 401); });

    assert.match(response, undefined);
  });

  it('Should return 404 for getting a non existing folder.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await get(`/folders/${randomId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for getting another users folder.', async () => {
    const response: any = await request
      .get(`${apiUrl}/folders/${createdFolderId}`)
      .auth('nezaga', 'nezaga')
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should update folder.', async () => {
    const updateFolderName: string = 'Updated integration test folder';
    const response: any = await put(`/folders/${createdFolderId}`, {
      name: updateFolderName
    });
    const folder: any = response.body;
    assert.match(folder.name, updateFolderName);
  });

  it('Should return 404 for updating a non existing folder.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await put(`/folders/${randomId}`, { name: 'Folder update will fail' })
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for updating another users folder.', async () => {
    const response: any = await request
      .put(`${apiUrl}/folders/${createdFolderId}`)
      .auth('nezaga', 'nezaga')
      .send({ name: 'Folder update will fail' })
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for deleting a non existing folder.', async () => {
    const randomId: string = new ObjectId().toString();
    const response: any = await deleteHelper(`/folders/${randomId}`)
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should return 404 for deleting another users folder.', async () => {
    const response: any = await request
      .delete(`${apiUrl}/folders/${createdFolderId}`)
      .auth('nezaga', 'nezaga')
      .catch((res) => { assert.match(res.status, 404); });

    assert.match(response, undefined);
  });

  it('Should delete folder.', async () => {
    const response: any = await deleteHelper(`/folders/${createdFolderId}`);
    assert.match(response.status, 204);
  });
});
