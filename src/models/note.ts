import { ObjectId } from 'mongodb';

export enum NoteVisibility {
  Private = 0,
  Public = 1
}

export enum NoteType {
  Text = 0,
  List = 1
}

export class Note {
  public _id: ObjectId;
  public ownerUserId: ObjectId;
  public name: string;
  public visibility: NoteVisibility;
  public type: NoteType;
  public text: string;
  public items: string[];
}
