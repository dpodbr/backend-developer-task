import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Note } from 'src/models/note';
import { GetNotesResponse, NotesFilter, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';
import { APIError } from 'src/utils/apiError';
import { handleError } from 'src/utils/errorHandler';

export class NotesController {
  public async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const sorting: NotesSorting = {
        visibility: undefined,
        name: undefined
      };

      if (req.query.sortVisibility !== undefined) {
        switch (req.query.sortVisibility) {
          case 'asc': {
            sorting.visibility = 1;
            break;
          }
          case 'desc': {
            sorting.visibility = -1;
            break;
          }
          default: {
            throw new APIError(400, 'Invalid sorting direction option.');
          }
        }
      }

      if (req.query.sortName !== undefined) {
        switch (req.query.sortName) {
          case 'asc': {
            sorting.name = 1;
            break;
          }
          case 'desc': {
            sorting.name = -1;
            break;
          }
          default: {
            throw new APIError(400, 'Invalid sorting direction option.');
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

      const filter: NotesFilter = {
        folderId: undefined,
        visibility: undefined,
        text: undefined
      };

      if (req.query.filterFolderId !== undefined) {
        if (req.userId === undefined) {
          throw new APIError(403, 'Unauthenticated users cannot filter by folders.');
        }

        const filterFolderId: string = req.query.filterFolderId as string ?? '';
        if (ObjectId.isValid(filterFolderId)) {
          filter.folderId = filterFolderId;
        } else {
          throw new APIError(400, 'Invalid folderId filter.');
        }
      }

      if (req.query.filterVisibility !== undefined) {
        const filterVisibility = Number(req.query.filterVisibility);
        if (filterVisibility >= 0 && filterVisibility < 2) {
          filter.visibility = filterVisibility;
        } else {
          throw new APIError(400, 'Invalid visibility filter.');
        }
      }

      if (req.query.filterText !== undefined) {
        filter.text = req.query.filterText as string;
      }

      const response: GetNotesResponse = await notesService.getNotes(req.userId, pagination, sorting, filter);
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
      const createdNote: Note = await notesService.createNote(req.userId!, folderId, note);
      res.status(201).json(createdNote);
    } catch (err) {
      handleError('createNote', err, res);
    }
  }

  public async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const noteId: string = req.params.id;
      const note: Note = req.body as Note;
      const updatedNote: Note = await notesService.updateNote(req.userId!, noteId, note);
      res.status(200).json(updatedNote);
    } catch (err) {
      handleError('updateNote', err, res);
    }
  }

  public async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const noteId: string = req.params.id;
      await notesService.deleteNote(req.userId!, noteId);
      res.status(204).end();
    } catch (err) {
      handleError('deleteNote', err, res);
    }
  }
}

export const notesController: NotesController = new NotesController();
