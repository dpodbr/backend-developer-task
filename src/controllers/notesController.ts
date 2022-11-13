import { Request, Response } from 'express';
import { GetNotesResponse, NotesPagination, notesService, NotesSorting } from 'src/services/notesService';
import { logger } from 'src/utils/logger';

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
            throw new Error('Invalid sorting option.');
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
              throw new Error('Invalid sorting direction option.');
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
          throw new Error('Invalid pagination values.');
        }
      }

      const result: GetNotesResponse = await notesService.getNotes(req.userId, pagination, sorting);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(500).send({ message: 'Notes retrieval failed.' });
        logger.warning('getNotes failed.', req);
      }
    } catch (err) {
      logger.error('getNotes failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public async getNote(req: Request, res: Response): Promise<void> {
  }

  public async createNote(req: Request, res: Response): Promise<void> {
  }

  public async updateNote(req: Request, res: Response): Promise<void> {
  }

  public async deleteNote(req: Request, res: Response): Promise<void> {
  }
}

export const notesController: NotesController = new NotesController();
