import { Request, Response } from 'express';
import { Knex } from 'knex';
import GeneralHelpers from '../../src/server/conversion/GeneralHelpers';
import MysqlConversion from '../../src/server/conversion/MysqlConversion';

describe('General helpers works', () => {
  it('Get all tables works', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = {} as any as Request;
    const spyGetTables = jest
      .spyOn(MysqlConversion.prototype, 'getTables')
      .mockResolvedValue([
        [
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ],
        null,
      ]);
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getAllTables(req, res);
    expect(spyGetTables).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Tables selected',
      code: 200000,
      content: [
        {
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        },
      ],
    });
  });

  it('Get all tables fails', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = {} as any as Request;
    const spyGetTables = jest
      .spyOn(MysqlConversion.prototype, 'getTables')
      .mockRejectedValue(new Error('Async error'));
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getAllTables(req, res);
    expect(spyGetTables).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    spyGetTables.mockRestore();
  });

  it('Get all tables fails for external get tables', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = {} as any as Request;
    const spyGetTables = jest
      .spyOn(MysqlConversion.prototype, 'getTables')
      .mockResolvedValue([null, 'Some error']);
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getAllTables(req, res);
    expect(spyGetTables).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    spyGetTables.mockRestore();
  });

  it('Get full tables works', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = { params: { tableName: 'table' } } as any as Request;
    const spyGetFullTable = jest
      .spyOn(MysqlConversion.prototype, 'getFullTable')
      .mockResolvedValue([
        {
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        } as any,
        null,
      ]);
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getFullTable(req, res);
    expect(spyGetFullTable).toHaveBeenCalledWith('table');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Table selected',
      code: 200000,
      content: {
        table_name: 'table',
        table_comment: 'comment',
        table_schema: 'schema',
      },
    });
  });

  it('Get full tables fails for external get tables', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = { params: { tableName: 'table' } } as any as Request;
    const spyGetFullTable = jest
      .spyOn(MysqlConversion.prototype, 'getFullTable')
      .mockResolvedValue([null, 'Some error']);
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getFullTable(req, res);
    expect(spyGetFullTable).toHaveBeenCalledWith('table');
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('Get full tables fails', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const req = { params: { tableName: 'table' } } as any as Request;
    const spyGetFullTable = jest
      .spyOn(MysqlConversion.prototype, 'getFullTable')
      .mockRejectedValue(new Error('Async error'));
    const generalHelpers = new GeneralHelpers(knex, configuration);
    await generalHelpers.getFullTable(req, res);
    expect(spyGetFullTable).toHaveBeenCalledWith('table');
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
