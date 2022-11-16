import { ObjectId } from 'mongodb';
import { assert, stub } from 'sinon';
import { Folder } from 'src/models/folder';
import { databaseService } from 'src/services/databaseService';
import { foldersService } from 'src/services/foldersService';
import { APIError } from 'src/utils/apiError';

describe('FoldersService getFolder.', () => {
  const userId: string = new ObjectId().toString();
  const folder1: Folder = {
    _id: new ObjectId(),
    name: 'Test folder 1',
    notes: []
  };
  const folder2: Folder = {
    _id: new ObjectId(),
    name: 'Test folder 2',
    notes: []
  };

  it('Should return one and only folder in result.', async () => {
    databaseService.getUsersCollection = stub().returns({
      find: stub().returns({
        project: stub().returns({
          next: stub().returns({
            folders: [folder1]
          })
        })
      })
    });
    const result: Folder = await foldersService.getFolder(userId, folder1._id.toString());
    assert.match(result._id.equals(folder1._id), true);
  });

  it('Should throw error for multiple folders.', async () => {
    databaseService.getUsersCollection = stub().returns({
      find: stub().returns({
        project: stub().returns({
          next: stub().returns({
            folders: [folder1, folder2]
          })
        })
      })
    });

    let error: any;
    try {
      await foldersService.getFolder(userId, folder1._id.toString());
    } catch (err) {
      error = err;
    }

    assert.match(error.message, 'Multiple folders found, expected one.');
  });

  it('Should throw error folder not found when empty results.', async () => {
    databaseService.getUsersCollection = stub().returns({
      find: stub().returns({
        project: stub().returns({
          next: stub().returns({
            folders: []
          })
        })
      })
    });

    let error: any;
    try {
      await foldersService.getFolder(userId, folder1._id.toString());
    } catch (err) {
      error = err as APIError;
    }

    assert.match(error.code, 404);
    assert.match(error.message, 'Folder not found.');
  });
});
