import { Collection, Db, MongoClient } from 'mongodb';

export class DatabaseService {
  private readonly client: MongoClient;
  private usersCollection: Collection;
  private notesCollection: Collection;

  constructor() {
    this.client = new MongoClient(`mongodb://${process.env.DB_USERNAME ?? 'root'}:${process.env.DB_PASSWORD ?? 'root'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '27017'}`);
  }

  public async openConnection(): Promise<MongoClient> {
    return await this.client.connect();
  }

  private loadCollection(collectionName: string): Collection {
    const db: Db = this.client.db(process.env.DB_DATABASE ?? 'notes');
    return db.collection(collectionName);
  }

  public getUsersCollection(): Collection {
    if (this.usersCollection !== undefined) {
      return this.usersCollection;
    } else {
      this.usersCollection = this.loadCollection(process.env.DB_USERS_COLLECTION ?? 'users');
      return this.usersCollection;
    }
  }

  public getNotesCollection(): Collection {
    if (this.notesCollection !== undefined) {
      return this.notesCollection;
    } else {
      this.notesCollection = this.loadCollection(process.env.DB_NOTES_COLLECTION ?? 'notes');
      return this.notesCollection;
    }
  }
}

export const databaseService: DatabaseService = new DatabaseService();
