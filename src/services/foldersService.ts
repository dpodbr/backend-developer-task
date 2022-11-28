import { ObjectId } from 'mongodb';
import { Folder } from 'src/models/folder';
import { APIError } from 'src/utils/apiError';
import { databaseService } from './databaseService';

export class FoldersService {
  public async getFolders(userId: ObjectId): Promise<Folder[]> {
    const query: any = {
      _id: userId
    };
    const projection: any = {
      folders: 1
    };

    const result: any = (await databaseService.getUsersCollection().find(query).project(projection).next());
    if (result?.folders !== undefined) {
      return result.folders as Folder[];
    } else {
      throw new APIError(500, 'Folder retrieval failed.');
    }
  }

  public async getFolder(userId: ObjectId, folderId: string): Promise<Folder> {
    const query: any = {
      _id: userId
    };
    const projection: any = {
      folders: {
        $elemMatch: {
          _id: new ObjectId(folderId)
        }
      }
    };

    const result: any = (await databaseService.getUsersCollection().find(query).project(projection).next());
    if (result != null) {
      // Document was found, so check folders result.
      if (result.folders !== undefined) {
        if (result.folders.length > 1) {
          // Should never happen.
          throw new Error('Multiple folders found, expected one.');
        } else if (result.folders.length === 1) {
          return result.folders[0] as Folder;
        } else {
          throw new APIError(404, 'Folder not found.');
        }
      } else {
        throw new APIError(404, 'Folder not found.');
      }
    } else {
      throw new APIError(404, 'User not found.');
    }
  }

  public async createFolder(userId: ObjectId, userFolder: Folder): Promise<Folder> {
    const folder: Folder = {
      _id: new ObjectId(),
      name: userFolder.name ?? 'New folder',
      notes: userFolder.notes ?? []
    };

    const query: any = {
      _id: userId
    };

    const update: any = {
      $push: {
        folders: folder
      }
    };

    const result: any = (await databaseService.getUsersCollection().updateOne(query, update));
    if (result?.modifiedCount > 0) {
      return folder;
    } else {
      throw new APIError(500, 'Folder creation failed.');
    }
  }

  public async updateFolder(userId: ObjectId, folderId: string, folder: Folder): Promise<Folder> {
    // Dissallow null in addition to undefined.
    if (folder.name == null) {
      throw new APIError(400, 'Missing required fields.');
    }

    const query: any = {
      _id: userId,
      'folders._id': new ObjectId(folderId)
    };
    const update: any = {
      $set: {
        'folders.$.name': folder.name
      }
    };

    const result: any = (await databaseService.getUsersCollection().updateOne(query, update));
    if (result?.matchedCount > 0) {
      return await this.getFolder(userId, folderId);
    } else if (result?.matchedCount === 0) {
      throw new APIError(404, 'Folder not found.');
    } else {
      throw new APIError(500, 'Updated folder failed.');
    }
  }

  public async deleteFolder(userId: ObjectId, folderId: string): Promise<void> {
    // Get folder to get a list of notes in the folder.
    const folder: Folder = await this.getFolder(userId, folderId);

    const query: any = {
      _id: userId
    };
    const update: any = {
      $pull: {
        folders: {
          _id: new ObjectId(folderId)
        }
      }
    };

    const resultUsers: any = (await databaseService.getUsersCollection().updateOne(query, update));
    if (resultUsers?.modifiedCount > 0) {
      if (folder.notes.length > 0) {
        const deleteQuery: any = {
          _id: {
            $in: folder.notes
          }
        };

        const resultNotes = await databaseService.getNotesCollection().deleteMany(deleteQuery);
        if (resultNotes?.deletedCount !== folder.notes.length) {
          throw new APIError(500, 'Notes deletion failed.');
        }
      }
    } else if (resultUsers?.matchedCount > 0) {
      throw new APIError(404, 'Folder not found.');
    } else {
      throw new APIError(500, 'Folder deletion failed.');
    }
  }
}

export const foldersService: FoldersService = new FoldersService();
