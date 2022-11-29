import { ObjectId } from 'mongodb';
import { Folder } from './folder';

export class User {
  public _id: ObjectId;
  public name: string;
  public username: string;
  public password: string;
  public folders: Folder[];
}
