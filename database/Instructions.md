# Database seed
Database is seeded with `docker-compose up` command. It drops users and notes collections and inserts notes.json and users.json into them.

### Optional
For development you can quickly spin up database container with below command:
```
docker run -d -p 27017:27017 --name notes-api -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=root mongo:latest
```
