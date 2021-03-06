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
    const oauthBoot = {} as any;
    const conversion = new Conversion(knex, oauthBoot);
    expect(conversion.knex).toStrictEqual(knex);
    expect(conversion.oauthBoot).toStrictEqual(oauthBoot);
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
    const conversion = new Conversion(knex, oauthBoot);
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
    const conversion = new Conversion(knex, oauthBoot);
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

    const conversion = new Conversion(knex, oauthBoot);

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(spyGenerateSwaggerJson).toHaveBeenCalled();
    expect(spyGetAllTablesColumns).toHaveBeenCalled();
    expect(req.swaggerDoc).toStrictEqual({ done: true });
    expect(next).toHaveBeenCalled();

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
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

    const conversion = new Conversion(knex, oauthBoot);

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

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

    const conversion = new Conversion(knex, oauthBoot);

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(spyGenerateSwaggerJson).not.toHaveBeenCalledWith();
    expect(spyGetAllTablesColumns).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);

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

    const conversion = new Conversion(knex, oauthBoot);

    await conversion.setSwaggerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: 500100,
      message: 'Unsupported data base',
    });

    spyGenerateSwaggerJson.mockRestore();
    spyGetAllTablesColumns.mockRestore();
  });
});
