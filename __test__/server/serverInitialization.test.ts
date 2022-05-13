import http from 'http';
import ServerInitialization from '../../src/server/ServerInitialization';
import Route from '../../src/server/util/Route';
import request from 'supertest';
import express from 'express';
import Conversion from '../../src/server/conversion/Conversions';
import MySqlConversion from '../../src/server/conversion/MysqlConversion';

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

  it('Expose database works', () => {
    const knex = {
      client: {
        config: { config: 1 },
      },
    };
    const addRoutesSpy = jest
      .spyOn(ServerInitialization.prototype, 'addRoutes')
      .mockImplementation(() => {
        return true;
      });

    const conversionSpy = jest
      .spyOn(Conversion.prototype, 'generateConversionRouter')
      .mockImplementation((() => {
        return true;
      }) as any);
    serverInitialization.exposeDataBase({}, knex as any);
    expect(serverInitialization.addRoutes).toHaveBeenCalled();
    expect(conversionSpy).toHaveBeenCalled();
    expect(addRoutesSpy).toHaveBeenCalled();
    conversionSpy.mockRestore();
    addRoutesSpy.mockRestore();
  });

  it('Init errors', async () => {
    const getTablesSpy = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockReturnValue([null, 'This is an error'] as any);

    const errorMock = jest.fn();

    serverInitialization.configuration.log = (() => {
      return { error: errorMock };
    }) as any;

    await serverInitialization.init();

    expect(getTablesSpy).toHaveBeenCalled();

    expect(errorMock).toHaveBeenCalled();

    getTablesSpy.mockRestore();
  });

  it('Add basic configuration works', () => {
    const useMock = jest.fn();
    const obGetMock = jest.fn();

    serverInitialization.app = {
      use: useMock,
      obGet: obGetMock,
    };

    serverInitialization.addBasicConfiguration();
    expect(useMock).toHaveBeenCalledTimes(6);
    expect(obGetMock).toHaveBeenCalledTimes(1);
  });

  it('Health endpoint works', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;
    serverInitialization.healthEndpoint({} as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Ok');
  });

  afterAll(() => {
    serverInitialization.server.close();
  });
});
