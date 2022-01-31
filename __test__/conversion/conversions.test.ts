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

  it('Generates conversion router', async () => {
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
