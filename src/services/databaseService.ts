import { Collection, Db, MongoClient } from 'mongodb';

export class DatabaseService {
  private readonly client: MongoClient;
  private usersCollection: Collection | null;

  constructor() {
    this.client = new MongoClient(`mongodb://${process.env.DB_USERNAME ?? 'root'}:${process.env.DB_PASSWORD ?? 'root'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '27017'}`);
  }

  public async openConnection(): Promise<MongoClient> {
    return await this.client.connect();
  }

  public getUsersCollection(): Collection {
    if (this.usersCollection != null) {
      return this.usersCollection;
    } else {
      const db: Db = this.client.db(process.env.DB_DATABASE ?? 'notes');
      this.usersCollection = db.collection(process.env.DB_USERS_COLLECTION ?? 'users');
      return this.usersCollection;
    }
  }
}

export const databaseService: DatabaseService = new DatabaseService();
