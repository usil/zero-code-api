import http from 'http';
import ServerInitialization from '../../src/server/ServerInitialization';
import Route from '../../src/server/util/Route';
import request from 'supertest';
import express from 'express';
import Conversion from '../../src/server/conversion/Conversions';
import MySqlConversion from '../../src/server/conversion/MysqlConversion';
import OauthBoot from 'nodeboot-oauth2-starter';

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
    serverInitialization.configuration.customSecurity = {
      useCustomSecurity: true,
      httpBaseUrl: 'http',
      validateAccess: {
        endpoint: '/someEndpoint',
        requestConf: {
          body: {
            token: 'sometoken',
            permission: '$.permissionString',
            appIdentifier: 'appid',
          },
          headers: {
            'x-usil-request-id': '$.permissionString',
          },
        },
        responseEvaluationConfig: {
          valueToEvaluate: '$.content.isAllowed',
          equalTo: true,
        },
      },
    };

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

  it('Skip morgan', () => {
    const req = { url: '/health' };
    const result = serverInitialization.skipMorgan(req as any, {} as any);
    expect(result).toBe(true);
    req.url = '/some';
    const resultTwo = serverInitialization.skipMorgan(req as any, {} as any);
    expect(resultTwo).toBe(false);
  });

  it('Expose database with custom security', () => {
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

    serverInitialization.exposeDataBaseWithCustomSecurity(knex as any);
    expect(conversionSpy).toHaveBeenCalled();
    expect(addRoutesSpy).toHaveBeenCalled();
    conversionSpy.mockRestore();
    addRoutesSpy.mockRestore();
  });

  it('Expose database works', () => {
    const knex = {
      client: {
        config: { config: 1 },
      },
    };

    serverInitialization.addRoutes = jest.fn();

    const conversionSpy = jest
      .spyOn(Conversion.prototype, 'generateConversionRouter')
      .mockImplementation((() => {
        return true;
      }) as any);

    serverInitialization.exposeDataBase({}, knex as any);
    expect(conversionSpy).toHaveBeenCalled();
    conversionSpy.mockRestore();
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

  it('Init works', async () => {
    serverInitialization.useCustomSecurity = false;
    false;
    const getTablesSpy = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockReturnValue([[{ table_name: 'test' }], null] as any);

    const initSpy = jest
      .spyOn(OauthBoot.prototype, 'init')
      .mockImplementation(() => 'test');

    const errorMock = jest.fn();

    serverInitialization.configuration.log = (() => {
      return { error: jest.fn(), debug: jest.fn() };
    }) as any;

    serverInitialization.exposeDataBase = jest.fn();

    serverInitialization.configuration.log = (() => {
      return { error: jest.fn(), debug: jest.fn() };
    }) as any;

    await serverInitialization.init();

    expect(getTablesSpy).toHaveBeenCalled();
    expect(serverInitialization.exposeDataBase).toHaveBeenCalled();
    expect(initSpy).toHaveBeenCalled();

    getTablesSpy.mockRestore();
    initSpy.mockRestore();
  });

  it('Init with custom security', async () => {
    const getTablesSpy = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockReturnValue([[{ table_name: 'test' }], null] as any);

    serverInitialization.useCustomSecurity = true;

    serverInitialization.configuration.log = (() => {
      return { error: jest.fn(), debug: jest.fn() };
    }) as any;

    serverInitialization.exposeDataBaseWithCustomSecurity = jest.fn();

    serverInitialization.configuration.log = (() => {
      return { error: jest.fn(), debug: jest.fn() };
    }) as any;

    await serverInitialization.init();

    expect(getTablesSpy).toHaveBeenCalled();
    expect(
      serverInitialization.exposeDataBaseWithCustomSecurity,
    ).toHaveBeenCalled();

    getTablesSpy.mockRestore();
  });

  it('Add basic configuration works', () => {
    serverInitialization.useCustomSecurity = false;

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

  it('Add basic configuration works with custom security', () => {
    serverInitialization.useCustomSecurity = true;

    const useMock = jest.fn();
    const getMock = jest.fn();

    serverInitialization.app = {
      use: useMock,
      get: getMock,
    };

    serverInitialization.addBasicConfiguration();
    expect(useMock).toHaveBeenCalledTimes(6);
    expect(getMock).toHaveBeenCalledTimes(1);
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

  it('Test error handle', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    serverInitialization.errorHandle(
      {
        message: 'some error',
      },
      {} as any,
      res as any,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'some error',
        code: 500000,
      }),
    );
  });

  afterAll(() => {
    serverInitialization.server.close();
  });
});
