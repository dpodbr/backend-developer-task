import { ObjectId } from 'mongodb';

export class Folder {
  public _id: ObjectId;
  public name: string;
  public notes: ObjectId[];
}
