import { User } from 'src/models/entities/user';
import { databaseService } from './databaseService';

export class UsersService {
  public async getUsers(): Promise<User[]> {
    const users: User[] = (await databaseService.getUsersCollection().find({}).toArray()) as unknown as User[]; // First cast to unknown to avoid "neither type sufficiently overlaps with the other" error.
    return users;
  }
}

export const usersService: UsersService = new UsersService();
