export enum NoteVisibility {
  Private = 0,
  Public = 1
}

export enum NoteType {
  Text = 0,
  List = 1
}

export class Note {
  public id: string;
  public name: string;
  public visibility: NoteVisibility;
  public type: NoteType;
  public text: string;
  public items: string[];
}
