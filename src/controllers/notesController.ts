import { Request, Response } from 'express';
import { Note } from 'src/models/note';
import { GetNotesResponse, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';
import { APIError } from 'src/utils/apiError';
import { handleError } from 'src/utils/errorHandler';

export class NotesController {
  public async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const sorting: NotesSorting = {
        visibility: {
          sort: false,
          ascending: true
        },
        name: {
          sort: false,
          ascending: true
        }
      };

      if (req.query.sort !== undefined) {
        switch (req.query.sort) {
          case 'visibility': {
            sorting.visibility.sort = true;
            break;
          }
          case 'name': {
            sorting.name.sort = true;
            break;
          }
          default: {
            throw new APIError(400, 'Invalid sorting option.');
          }
        }

        if (req.query.dir !== undefined) {
          switch (req.query.dir) {
            case 'asc': {
              sorting.visibility.ascending = true;
              sorting.name.ascending = true;
              break;
            }
            case 'desc': {
              sorting.visibility.ascending = false;
              sorting.name.ascending = false;
              break;
            }
            default: {
              throw new APIError(400, 'Invalid sorting direction option.');
            }
          }
        }
      }

      let pagination: NotesPagination | undefined;
      if (req.query.page !== undefined && req.query.limit !== undefined) {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        if (page > 0 && limit > 0) {
          pagination = { page, limit };
        } else {
          throw new APIError(400, 'Invalid pagination values.');
        }
      }

      const response: GetNotesResponse = await notesService.getNotes(req.userId, pagination, sorting);
      res.status(200).json(response);
    } catch (err) {
      handleError('getNotes', err, res);
    }
  }

  public async getNote(req: Request, res: Response): Promise<void> {
    try {
      const noteId: string = req.params.id;
      const note: Note = await notesService.getNote(noteId, req.userId);
      res.status(200).json(note);
    } catch (err) {
      handleError('getNote', err, res);
    }
  }

  public async createNote(req: Request, res: Response): Promise<void> {
    try {
      const note: Note = req.body as Note;
      const folderId: string = req.params.folderId;
      const createdNote: Note = await notesService.createNote(req.userId, folderId, note);
      res.status(201).json(createdNote);
    } catch (err) {
      handleError('createNote', err, res);
    }
  }

  public async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const noteId: string = req.params.id;
      const note: Note = req.body as Note;
      const updatedNote: Note = await notesService.updateNote(req.userId, noteId, note);
      res.status(200).json(updatedNote);
    } catch (err) {
      handleError('updateNote', err, res);
    }
  }

  public async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const noteId: string = req.params.id;
      await notesService.deleteNote(req.userId, noteId);
      res.status(204).end();
    } catch (err) {
      handleError('deleteNote', err, res);
    }
  }
}

export const notesController: NotesController = new NotesController();
