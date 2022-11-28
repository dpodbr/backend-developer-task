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

export interface NotesSorting {
  visibility: number | undefined;
  name: number | undefined;
}

export interface NotesFilter {
  folderId: string | undefined;
  visibility: number | undefined;
  text: string | undefined;
}

export interface GetNotesResponse {
  notes: Note[];
  page: number;
  totalPages: number;
}

export class NotesService {
  public async getNotes(userId?: ObjectId, pagination?: NotesPagination, sorting?: NotesSorting, filter?: NotesFilter): Promise<GetNotesResponse> {
    // Get users private and others public notes.
    const query: { $and: any[] } = {
      $and: [{
        $or: [
          { ownerUserId: userId },
          { visibility: 1 }
        ]
      }]
    };

    // Sorting.
    const sort: any = {};
    if (sorting?.visibility !== undefined) {
      sort.visibility = sorting.visibility;
    }
    if (sorting?.name !== undefined) {
      sort.name = sorting.name;
    }
    if (Object.keys(sort).length === 0) {
      // Default sort if no sorting options given.
      sort.visibility = 1;
    }

    // Filtering.
    if (filter?.folderId !== undefined && userId !== undefined) {
      const folder: Folder = await foldersService.getFolder(userId, filter.folderId);
      query.$and.push({
        _id: {
          $in: folder.notes
        }
      });
    }
    if (filter?.visibility !== undefined) {
      query.$and.push({ visibility: filter.visibility });
    }
    if (filter?.text !== undefined) {
      query.$and.push({
        text: {
          $regex: filter.text,
          $options: 'i'
        }
      });
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

  public async getNote(noteId: string, userId?: ObjectId): Promise<Note> {
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

  public async createNote(userId: ObjectId, folderId: string, userNote: Note): Promise<Note> {
    // Check folder exists for this user. This will throw if folder is not returned.
    const folder: Folder = await foldersService.getFolder(userId, folderId);

    // Insert into notes.
    const note: Note = {
      _id: new ObjectId(),
      ownerUserId: userId,
      name: userNote.name ?? 'New note',
      visibility: userNote.visibility ?? 0,
      type: userNote.type ?? 0,
      text: userNote.text ?? '',
      items: userNote.items ?? []
    };
    const resultNotes: any = (await databaseService.getNotesCollection().insertOne(note));
    if (resultNotes?.insertedId !== undefined) {
      // Link note with user folder.
      const query: any = {
        _id: userId,
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

  public async updateNote(userId: ObjectId, noteId: string, userNote: Note): Promise<Note> {
    const note: any = {};
    // Dissallow null in addition to undefined.
    if (userNote.name != null) {
      note.name = userNote.name;
    }
    if (userNote.visibility != null) {
      note.visibility = userNote.visibility;
    }
    if (userNote.type != null) {
      note.type = userNote.type;
    }
    if (userNote.text != null) {
      note.text = userNote.text;
    }
    if (userNote.items != null) {
      note.items = userNote.items;
    }

    if (Object.keys(note).length === 0) {
      throw new APIError(400, 'Missing required fields.');
    }

    const query: any = {
      _id: new ObjectId(noteId),
      ownerUserId: userId
    };
    const update: any = {
      $set: note
    };

    const result: any = (await databaseService.getNotesCollection().updateOne(query, update));
    if (result?.matchedCount > 0) {
      return await this.getNote(noteId, userId);
    } else {
      throw new APIError(404, 'Note not found.');
    }
  }

  public async deleteNote(userId: ObjectId, noteId: string): Promise<void> {
    const query: any = {
      _id: new ObjectId(noteId),
      ownerUserId: userId
    };

    const resultNotes: any = (await databaseService.getNotesCollection().deleteOne(query));
    if (resultNotes?.deletedCount > 0) {
      // Delete note from user folder.
      const usersQuery: any = {
        _id: userId,
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
      throw new APIError(404, 'Note not found.');
    }
  }
}

export const notesService: NotesService = new NotesService();
