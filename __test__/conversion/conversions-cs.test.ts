import { Request, Response } from 'express';
import { Knex } from 'knex';
import Conversion from '../../src/server/conversion/Conversions';
import MySqlConversion from '../../src/server/conversion/MysqlConversion';
import SwaggerGenerator from '../../src/server/conversion/SwaggerGenerator';

describe('All conversion functions work', () => {
  it('Constructs it correctly', () => {
    const knex = {
      client: {
        config: {
          engine: 'mysql',
        },
      },
    } as any as Knex;
    const conversion = new Conversion(knex);
    expect(conversion.knex).toStrictEqual(knex);
  });

  it('Generates conversion router work', async () => {
    const knex = {
      client: {
        config: {
          engine: 'mysql',
        },
      },
    } as any as Knex;
    const obGet = jest.fn();
    const obPut = jest.fn();
    const obPost = jest.fn();
    const obDelete = jest.fn();

    const oauthBoot = {
      bootOauthExpressRouter: jest.fn().mockReturnValue({
        obGet,
        obPut,
        obPost,
        obDelete,
      }),
    } as any;
    const spyGetTables = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockResolvedValue([
        [
          {
            table_name: 'table',
            table_schema: 'schema',
          },
        ],
        null,
      ]);
    const conversion = new Conversion(knex);
    const setSwaggerSpy = jest.spyOn(conversion, 'setSwaggerEndPoint');
    const setGetTablesListSpy = jest.spyOn(conversion, 'setGetTablesList');
    const setGetFullTableSpy = jest.spyOn(conversion, 'setGetFullTable');
    const setGetALLEndpointsSpy = jest.spyOn(conversion, 'setGetALLEndpoints');
    const setGetOneByIdEndpointsSpy = jest.spyOn(
      conversion,
      'setGetOneByIdEndpoints',
    );
    const setGetUpdateByIdEndpointsSpy = jest.spyOn(
      conversion,
      'setGetUpdateByIdEndpoints',
    );

    const setDeleteOneByIdEndpointsSpy = jest.spyOn(
      conversion,
      'setDeleteOneByIdEndpoints',
    );

    const setCreateEndpointsSpy = jest.spyOn(conversion, 'setCreateEndpoints');

    const setQueryEndpointsSpy = jest.spyOn(conversion, 'setQueryEndpoints');

    await conversion.generateConversionRouter();

    expect(setSwaggerSpy).toHaveBeenCalled();
    expect(setGetTablesListSpy).toHaveBeenCalled();
    expect(setGetFullTableSpy).toHaveBeenCalled();
    expect(setGetALLEndpointsSpy).toHaveBeenCalled();
    expect(setGetUpdateByIdEndpointsSpy).toHaveBeenCalled();
    expect(setDeleteOneByIdEndpointsSpy).toHaveBeenCalled();
    expect(setGetOneByIdEndpointsSpy).toHaveBeenCalled();
    expect(setCreateEndpointsSpy).toHaveBeenCalled();
    expect(setQueryEndpointsSpy).toHaveBeenCalled();

    spyGetTables.mockRestore();
    setSwaggerSpy.mockRestore();
    setGetTablesListSpy.mockRestore();
    setGetFullTableSpy.mockRestore();
    setGetALLEndpointsSpy.mockRestore();
    setGetUpdateByIdEndpointsSpy.mockRestore();
    setDeleteOneByIdEndpointsSpy.mockRestore();
    setGetOneByIdEndpointsSpy.mockRestore();
    setCreateEndpointsSpy.mockRestore();
    setQueryEndpointsSpy.mockRestore();
  });

  it('Generates conversion router errors', async () => {
    const knex = {
      client: {
        config: {
          engine: 'mysql',
        },
      },
    } as any as Knex;
    const oauthBoot = {
      bootOauthExpressRouter: jest.fn().mockReturnValue({}),
    } as any;
    const spyGetTables = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockResolvedValue([null, 'Some Error']);
    const conversion = new Conversion(knex);
    await expect(conversion.generateConversionRouter()).rejects.toThrow();
    spyGetTables.mockRestore();
  });

  it('Generates swagger', async () => {
    const knex = {
      client: {
        config: {
          client: 'mysql2',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;
    const spyGetAllTablesColumns = jest
      .spyOn(MySqlConversion.prototype, 'getAllTablesColumns')
      .mockResolvedValue([
        {
          tablesColumns: {
            table: [
              {
                column_name: 'string',
                column_default: 'string',
                is_nullable: 'string',
                data_type: 'string',
                column_type: 'string',
                extra: 'string',
                column_comment: 'string',
                column_key: 'string',
              },
            ],
          },
          tables: [
            {
              table_name: 'table',
              table_comment: 'comment',
              table_schema: 'schema',
            },
          ],
        },
        null,
      ]);

    const spyGenerateSwaggerJson = jest
      .spyOn(SwaggerGenerator.prototype, 'generateJSON')
      .mockReturnValue({ done: true } as any);

    const conversion = new Conversion(knex);

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(spyGenerateSwaggerJson).toHaveBeenCalled();
    expect(spyGetAllTablesColumns).toHaveBeenCalled();
    expect(req.swaggerDoc).toStrictEqual({ done: true });
    expect(next).toHaveBeenCalled();

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
  });

  it('Test refresh endpoint', async () => {
    const spyGetTables = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockResolvedValue([
        [
          {
            table_name: 'table',
            table_schema: 'schema',
          },
        ],
        null,
      ]);

    const knex = {
      client: {
        config: {
          client: 'mysql2',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;

    const conversion = new Conversion(knex);

    conversion.setGetOneByIdEndpoints = jest.fn();
    conversion.setGetALLEndpoints = jest.fn();
    conversion.setGetUpdateByIdEndpoints = jest.fn();
    conversion.setDeleteOneByIdEndpoints = jest.fn();
    conversion.setCreateEndpoints = jest.fn();
    conversion.setQueryEndpoints = jest.fn();
    conversion.setRawDataBaseQueryEndPoint = jest.fn();
    conversion.setCreateTableEndpoint = jest.fn();

    await conversion.refreshEndpoints(req, res, next);

    expect(conversion.setGetOneByIdEndpoints).toHaveBeenCalled();
    expect(conversion.setGetALLEndpoints).toHaveBeenCalled();
    expect(conversion.setGetUpdateByIdEndpoints).toHaveBeenCalled();
    expect(conversion.setDeleteOneByIdEndpoints).toHaveBeenCalled();
    expect(conversion.setCreateEndpoints).toHaveBeenCalled();
    expect(conversion.setQueryEndpoints).toHaveBeenCalled();
    expect(conversion.setCreateTableEndpoint).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Endpoints refreshed',
      code: 200000,
    });
    spyGetTables.mockRestore();
  });

  it('Test refresh endpoint errors from tables', async () => {
    const spyGetTables = jest
      .spyOn(MySqlConversion.prototype, 'getTables')
      .mockResolvedValue([null, 'error']);

    const knex = {
      client: {
        config: {
          client: 'mysql2',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;

    const conversion = new Conversion(knex);

    conversion.returnError = jest.fn();

    await conversion.refreshEndpoints(req, res, next);

    expect(conversion.returnError).toHaveBeenCalled();

    spyGetTables.mockRestore();
  });

  it('Generates swagger fails', async () => {
    const knex = {
      client: {
        config: {
          client: 'mysql2',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;
    const spyGetAllTablesColumns = jest
      .spyOn(MySqlConversion.prototype, 'getAllTablesColumns')
      .mockRejectedValue(new Error('Async error'));

    const spyGenerateSwaggerJson = jest
      .spyOn(SwaggerGenerator.prototype, 'generateJSON')
      .mockReturnValue({ done: true } as any);

    const conversion = new Conversion(knex);

    conversion.returnError = jest.fn();

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(conversion.returnError).toHaveBeenCalled();

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
  });

  it('Generates swagger error from tables', async () => {
    const knex = {
      client: {
        config: {
          client: 'mysql2',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;
    const spyGetAllTablesColumns = jest
      .spyOn(MySqlConversion.prototype, 'getAllTablesColumns')
      .mockResolvedValue([null, 'some error']);

    const spyGenerateSwaggerJson = jest
      .spyOn(SwaggerGenerator.prototype, 'generateJSON')
      .mockReturnValue({ done: true } as any);

    const conversion = new Conversion(knex);

    conversion.returnError = jest.fn();

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(spyGenerateSwaggerJson).not.toHaveBeenCalledWith();
    expect(spyGetAllTablesColumns).toHaveBeenCalled();
    expect(conversion.returnError).toHaveBeenCalled();

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
  });

  it('Generates swagger error from unsupported data base', async () => {
    const knex = {
      client: {
        config: {
          client: 'not',
        },
      },
    } as any as Knex;

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('1600'),
      swaggerDoc: '',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const next = jest.fn();

    const oauthBoot = {} as any;
    const spyGetAllTablesColumns = jest
      .spyOn(MySqlConversion.prototype, 'getAllTablesColumns')
      .mockResolvedValue([null, 'some error']);

    const spyGenerateSwaggerJson = jest
      .spyOn(SwaggerGenerator.prototype, 'generateJSON')
      .mockReturnValue({ done: true } as any);

    const conversion = new Conversion(knex);

    conversion.returnError = jest.fn();

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(conversion.returnError).toHaveBeenCalled();

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
  });

  it('Error function', () => {
    const knex = {
      client: {
        config: {
          client: 'not',
        },
      },
    } as any as Knex;
    const oauthBoot = {} as any;
    const conversion = new Conversion(knex);

    const nextErrorMock = jest.fn();

    conversion.returnError(
      'some error',
      'some error',
      500000,
      500,
      'test',
      nextErrorMock,
    );

    expect(nextErrorMock).toBeCalledWith({
      message: 'some error',
      statusCode: 500,
      errorCode: 500000,
      onFunction: 'test',
      onFile: 'Conversions.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: undefined,
    });

    conversion.returnError(
      'some error',
      'some error',
      500000,
      500,
      'test',
      nextErrorMock,
      { response: true },
    );

    expect(nextErrorMock).toBeCalledWith({
      message: 'some error',
      statusCode: 500,
      errorCode: 500000,
      onFunction: 'test',
      onFile: 'Conversions.ts',
      logMessage: 'some error',
      errorObject: true,
      originalError: undefined,
    });

    conversion.returnError(
      'some error',
      'some error',
      500000,
      500,
      'test',
      nextErrorMock,
      { sqlState: true },
    );

    expect(nextErrorMock).toBeCalledWith({
      message: 'Data base error. some error',
      statusCode: 500,
      errorCode: 500000,
      onFunction: 'test',
      onFile: 'Conversions.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: { sqlState: true },
    });
  });
});
