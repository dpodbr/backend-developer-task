import { ObjectId } from 'mongodb';
import { Folder } from 'src/models/folder';
import { databaseService } from './databaseService';

export class FoldersService {
  public async getFolders(userId: string): Promise<Folder[] | null> {
    const query: any = {
      _id: new ObjectId(userId)
    };
    const projection: any = {
      folders: 1
    };

    const result: any = (await databaseService.getUsersCollection().find(query).project(projection).next());
    if (result?.folders !== undefined) {
      return result.folders as Folder[];
    } else {
      return null;
    }
  }

  public async getFolder(userId: string, folderId: string): Promise<Folder | null> {
    const query: any = {
      _id: new ObjectId(userId)
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
          throw new Error('Multiple folders found, expected one.');
        } else if (result.folders.length === 1) {
          return result.folders[0] as Folder;
        }
      } else {
        throw new Error('Folder not found.');
      }
    }

    return null;
  }

  public async createFolder(userId: string, folder: Folder): Promise<Folder | null> {
    folder._id = new ObjectId();

    const query: any = {
      _id: new ObjectId(userId)
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
      return null;
    }
  }

  public async updateFolder(userId: string, folderId: string, folder: Folder): Promise<Folder | null> {
    const query: any = {
      _id: new ObjectId(userId),
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
      throw new Error('Folder not found.');
    }

    return null;
  }

  public async deleteFolder(userId: string, folderId: string): Promise<boolean> {
    const query: any = {
      _id: new ObjectId(userId)
    };
    const update: any = {
      $pull: {
        folders: {
          _id: new ObjectId(folderId)
        }
      }
    };

    const result: any = (await databaseService.getUsersCollection().updateOne(query, update));
    if (result?.modifiedCount > 0) {
      return true;
    } else if (result?.matchedCount > 0) {
      throw new Error('Folder not found.');
    } else {
      return false;
    }
  }
}

export const foldersService: FoldersService = new FoldersService();
