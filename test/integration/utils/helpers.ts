import 'dotenv/config';
import * as request from 'superagent';

export const apiUrl: string = `http://localhost:${process.env.PORT ?? 8000}`;

const username: string = 'davidpo';
const password: string = 'davidpo';

export async function get(path: string): Promise<request.Request> {
  return await request
    .get(`${apiUrl}${path}`)
    .auth(username, password);
}

export async function post(path: string, data: any): Promise<request.Request> {
  return await request
    .post(`${apiUrl}${path}`)
    .auth(username, password)
    .send(data);
}

export async function put(path: string, data: any): Promise<request.Request> {
  return await request
    .put(`${apiUrl}${path}`)
    .auth(username, password)
    .send(data);
}

export async function deleteHelper(path: string): Promise<request.Request> {
  return await request
    .delete(`${apiUrl}${path}`)
    .auth(username, password);
}
