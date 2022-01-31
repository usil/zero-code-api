import http from 'http';
import ServerInitialization from '../../src/server/ServerInitialization';
import Route from '../../src/server/util/Route';
import request from 'supertest';
import express from 'express';

const testPort = 8081;

describe('Create an express app and an http server', () => {
  let serverInitialization: ServerInitialization;
  let server: http.Server;

  beforeAll(() => {
    jest.clearAllMocks();
    jest.spyOn(ServerInitialization.prototype, 'addBasicConfiguration');
    jest.spyOn(ServerInitialization.prototype, 'addRoutes');
    jest.spyOn(ServerInitialization.prototype, 'createServer');
    jest.spyOn(ServerInitialization.prototype, 'addKnexjsConfig');
    serverInitialization = new ServerInitialization(testPort);
    serverInitialization.app = express();
    const routeTest = new Route('/test');
    routeTest.router.get('/', (req, res) => {
      res.sendStatus(200);
    });
    serverInitialization.addRoutes(routeTest);
    server = serverInitialization.createServer();
  });

  it('Correct initialization instance', () => {
    expect(serverInitialization).toBeInstanceOf(ServerInitialization);
  });

  it('The server is correct', () => {
    expect(server).toBeInstanceOf(http.Server);
  });

  it('The app executes all of the necessary functions', () => {
    expect(serverInitialization.addRoutes).toHaveBeenCalledTimes(1);
    expect(serverInitialization.createServer).toHaveBeenCalledTimes(1);
    expect(serverInitialization.addKnexjsConfig).toHaveBeenCalledTimes(1);
  });

  it('Adds a path correctly', async () => {
    const response = await request(serverInitialization.app).get('/test');
    expect(response.statusCode).toBe(200);
  });

  afterAll(() => {
    serverInitialization.server.close();
  });
});
