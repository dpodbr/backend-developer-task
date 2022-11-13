import { ObjectId } from 'mongodb';
import { Note } from 'src/models/note';
import { databaseService } from './databaseService';

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
}

export const notesService: NotesService = new NotesService();
