import { ObjectId } from 'mongodb';
import { Note } from './note';

export class Folder {
  public _id: ObjectId;
  public name: string;
  public notes: Note[];
}
