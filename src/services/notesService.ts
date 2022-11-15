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
    let notes: Note[] = [];

    if (userId !== undefined) {
      // Get users notes.
      const userNotesQuery: any = {
        ownerUserId: new ObjectId(userId)
      };

      const usersNotes: Note[] = (await databaseService.getNotesCollection().find(userNotesQuery).toArray()) as Note[];
      if (usersNotes.length > 0) {
        notes.push(...usersNotes);
      }
    }

    // Get public notes.
    const publicNotesQuery: any = {
      visibility: 1
    };

    const publicNotes: Note[] = (await databaseService.getNotesCollection().find(publicNotesQuery).toArray()) as Note[];
    if (publicNotes.length > 0) {
      for (const publicNote of publicNotes) {
        // Exclude possible duplicates from users notes.
        if (!notes.some(note => note._id.equals(publicNote._id))) {
          notes.push(publicNote);
        }
      }
    }

    if (sorting !== undefined) {
      if (sorting.visibility.sort) {
        notes.sort((a, b) => {
          if (sorting.visibility.ascending) {
            return a.visibility - b.visibility;
          } else {
            return b.visibility - a.visibility;
          }
        });
      }

      if (sorting.name.sort) {
        notes.sort((a, b) => {
          if (sorting.name.ascending) {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
      }
    }

    let page: number = 1;
    let totalPages: number = 1;
    if (pagination !== undefined) {
      page = pagination.page;
      totalPages = Math.ceil(notes.length / pagination.limit);

      // Pages from query should start with 1.
      notes = notes.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
    }

    return {
      notes,
      page,
      totalPages
    };
  }

  public async getNote(noteId: string, userId?: string): Promise<Note> {
    const query: any = {
      _id: new ObjectId(noteId)
    };

    const note: Note = (await databaseService.getNotesCollection().find(query).next()) as Note;
    if (note != null) {
      if (note.ownerUserId.equals(new ObjectId(userId)) || note.visibility === 1) {
        return note;
      } else {
        throw new APIError(403, 'This is a private note.');
      }
    } else {
      throw new APIError(404, 'Note not found.');
    }
  }

  public async createNote(userId: string, folderId: string, note: Note): Promise<Note> {
    // Check folder exists for this user.
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
        // Updating users folders with note failed. Try to cleanup previously inserted note.
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
      _id: new ObjectId(noteId)
    };
    const storedNote: Note = (await databaseService.getNotesCollection().find(query).next()) as Note;
    if (storedNote != null) {
      // Check note ownership before updating.
      if (storedNote.ownerUserId.equals(userId)) {
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
        if (result?.modifiedCount > 0) {
          return await this.getNote(noteId, userId);
        } else {
          throw new APIError(500, 'Note update failed.');
        }
      } else {
        throw new APIError(403, 'Note owner and user mismatch.');
      }
    } else {
      throw new APIError(404, 'Note not found.');
    }
  }

  public async deleteNote(userId: string, noteId: string): Promise<void> {
    const query: any = {
      _id: new ObjectId(noteId)
    };

    const storedNote: Note = (await databaseService.getNotesCollection().find(query).next()) as Note;
    if (storedNote != null) {
      // Check note ownership before deleting.
      if (storedNote.ownerUserId.equals(userId)) {
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
      } else {
        throw new APIError(403, 'Note owner and user mismatch.');
      }
    } else {
      throw new APIError(404, 'Note not found.');
    }
  }
}

export const notesService: NotesService = new NotesService();
