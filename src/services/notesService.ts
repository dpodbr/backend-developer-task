import { ObjectId } from 'mongodb';
import { Folder } from 'src/models/folder';
import { Note } from 'src/models/note';
import { APIError } from 'src/utils/apiError';
import { databaseService } from './databaseService';
import { foldersService } from './foldersService';

export interface NotesPagination {
  page: number;
  limit: number;
}

export interface SortParams {
  sort: boolean;
  ascending: boolean;
}

export interface NotesSorting {
  visibility: SortParams;
  name: SortParams;
}

export interface GetNotesResponse {
  notes: Note[];
  page: number;
  totalPages: number;
}

export class NotesService {
  public async getNotes(userId?: string, pagination?: NotesPagination, sorting?: NotesSorting): Promise<GetNotesResponse> {
    // Get users private and others public notes.
    const query = {
      $or: [
        { ownerUserId: new ObjectId(userId) },
        { visibility: 1 }
      ]
    };

    const sort: any = {};
    if (sorting !== undefined) {
      if (sorting.visibility.sort) {
        sort.visibility = sorting.visibility.ascending ? 1 : -1;
      }
      if (sorting.name.sort) {
        sort.name = sorting.name.ascending ? 1 : -1;
      }
    }

    if (Object.keys(sort).length === 0) {
      // Default sort if no sorting options given.
      sort.visibility = 1;
    }

    const notes: Note[] = (await databaseService
      .getNotesCollection()
      .find(query)
      .sort({ ...sort, _id: 1 })
      .skip(pagination !== undefined ? ((pagination.page - 1) * pagination.limit) : 0)
      .limit(pagination !== undefined ? pagination.limit : 0)
      .toArray()) as Note[];
    const countTotal: number = (await databaseService.getNotesCollection().countDocuments(query));

    let page: number = 1;
    let totalPages: number = 1;
    if (pagination !== undefined) {
      page = pagination.page;
      totalPages = Math.ceil(countTotal / pagination.limit);
    }

    return {
      notes,
      page,
      totalPages
    };
  }

  public async getNote(noteId: string, userId?: string): Promise<Note> {
    const query: any = {
      _id: new ObjectId(noteId),
      $or: [
        { ownerUserId: userId },
        { visibility: 1 }
      ]
    };

    const note: Note = (await databaseService.getNotesCollection().find(query).next()) as Note;
    if (note != null) {
      return note;
    } else {
      throw new APIError(404, 'Note not found.');
    }
  }

  public async createNote(userId: string, folderId: string, note: Note): Promise<Note> {
    // Check folder exists for this user. This will throw if folder is not returned.
    const folder: Folder = await foldersService.getFolder(userId, folderId);

    // Insert into notes.
    note._id = new ObjectId();
    note.ownerUserId = new ObjectId(userId);
    const resultNotes: any = (await databaseService.getNotesCollection().insertOne(note));
    if (resultNotes?.insertedId !== undefined) {
      // Link note with user folder.
      const query: any = {
        _id: new ObjectId(userId),
        'folders._id': folder._id
      };
      const update: any = {
        $push: {
          'folders.$.notes': note._id
        }
      };

      const resultUsers: any = (await databaseService.getUsersCollection().updateOne(query, update));
      if (resultUsers?.modifiedCount > 0) {
        return note;
      } else {
        // Updating users folder with note failed. Try to cleanup previously inserted note.
        const deleteQuery = {
          _id: note._id
        };
        await databaseService.getNotesCollection().deleteOne(deleteQuery);
        throw new APIError(500, 'Inserting note in folder failed.');
      }
    } else {
      throw new APIError(500, 'Note creation failed.');
    }
  }

  public async updateNote(userId: string, noteId: string, note: Note): Promise<Note> {
    const query: any = {
      _id: new ObjectId(noteId),
      ownerUserId: new ObjectId(userId)
    };
    const update: any = {
      $set: {
        name: note.name,
        visibility: note.visibility,
        type: note.type,
        text: note.text,
        items: note.items
      }
    };

    const result: any = (await databaseService.getNotesCollection().updateOne(query, update));
    if (result?.matchedCount > 0) {
      return await this.getNote(noteId, userId);
    } else {
      throw new APIError(500, 'Note update failed.');
    }
  }

  public async deleteNote(userId: string, noteId: string): Promise<void> {
    const query: any = {
      _id: new ObjectId(noteId),
      ownerUserId: new ObjectId(userId)
    };

    const resultNotes: any = (await databaseService.getNotesCollection().deleteOne(query));
    if (resultNotes?.deletedCount > 0) {
      // Delete note from user folder.
      const usersQuery: any = {
        _id: new ObjectId(userId),
        'folders.notes': { $in: [new ObjectId(noteId)] }
      };
      const usersUpdate: any = {
        $pull: {
          'folders.$.notes': new ObjectId(noteId)
        }
      };

      const resultUsers: any = (await databaseService.getUsersCollection().updateOne(usersQuery, usersUpdate));
      if (resultUsers?.modifiedCount !== 1) {
        throw new APIError(500, 'Deleting note from user folder failed.');
      }
    } else {
      throw new APIError(500, 'Note deletion failed.');
    }
  }
}

export const notesService: NotesService = new NotesService();
