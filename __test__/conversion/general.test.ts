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
    generalHelpers.returnError = jest.fn();
    const mockNext = jest.fn();
    await generalHelpers.getAllTables(req, res, mockNext);
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

  it('Columns to select', () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;

    const generalHelpers = new GeneralHelpers(knex, configuration);

    const localTableSettings = {
      table: ['id'],
    };

    const fullTable = {
      columns: [
        {
          column_name: 'id',
        },
      ],
    } as any;

    const columnsToSelect = generalHelpers.columnsToSelect(
      'table',
      localTableSettings,
      fullTable,
    );

    expect(columnsToSelect[0].column_name).toBe('id');
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
    generalHelpers.returnError = jest.fn();
    const mockNext = jest.fn();

    await generalHelpers.getAllTables(req, res, mockNext);
    expect(generalHelpers.returnError).toHaveBeenCalled();

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
    const mockNext = jest.fn();
    generalHelpers.returnError = jest.fn();
    await generalHelpers.getAllTables(req, res, mockNext);
    expect(generalHelpers.returnError).toHaveBeenCalled();

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
          columns: ['id'],
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        } as any,
        null,
      ]);
    const generalHelpers = new GeneralHelpers(knex, configuration);
    const mockNext = jest.fn();
    generalHelpers.returnError = jest.fn();
    await generalHelpers.getFullTable(req, res, mockNext);
    expect(spyGetFullTable).toHaveBeenCalledWith('table');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Table selected',
      code: 200000,
      content: {
        columns: ['id'],
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
    const mockNext = jest.fn();
    generalHelpers.returnError = jest.fn();
    await generalHelpers.getFullTable(req, res, mockNext);
    expect(generalHelpers.returnError).toHaveBeenCalled();
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
    const mockNext = jest.fn();
    generalHelpers.returnError = jest.fn();
    await generalHelpers.getFullTable(req, res, mockNext);
    expect(generalHelpers.returnError).toHaveBeenCalled();
  });

  it('Error function', () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;
    const generalHelpers = new GeneralHelpers(knex, configuration);

    const nextErrorMock = jest.fn();

    generalHelpers.returnError(
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
      onFile: 'GeneralHelpers.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: undefined,
    });

    generalHelpers.returnError(
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
      onFile: 'GeneralHelpers.ts',
      logMessage: 'some error',
      errorObject: true,
      originalError: undefined,
    });

    generalHelpers.returnError(
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
      onFile: 'GeneralHelpers.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: { sqlState: true },
    });
  });
});
