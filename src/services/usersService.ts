import { User } from 'src/models/user';
import { databaseService } from './databaseService';

export class UsersService {
  public async getUsers(): Promise<User[]> {
    const users: User[] = (await databaseService.getUsersCollection().find().toArray()) as User[];
    return users;
  }
}

export const usersService: UsersService = new UsersService();
