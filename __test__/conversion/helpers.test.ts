import { Request, Response } from 'express';
import { Knex } from 'knex';
import ConversionHelpers from '../../src/server/conversion/ConversionHelpers';
import CreateTableFromJson from '../../src/server/util/CreateTableFromJson';

describe('All conversion helper functions works', () => {
  it('Get all works', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([{ id: 1 }]),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {
        orderType: 'desc',
        orderByColumn: 'other_id',
        itemsPerPage: 10,
        pageIndex: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getAll('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.select).toHaveBeenCalled();
    expect(knex.offset).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({
      content: {
        items: [{ id: 1 }],
        pageIndex: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
      },
      message: 'success',
      code: 200000,
    });
  });

  it('Raw query works', async () => {
    const knex = {
      raw: jest.fn().mockResolvedValue([1]),
    } as any as Knex;
    const req = {
      body: {
        dbQuery: 'SELECT',
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.rawQuery(req, res, mockNext);

    expect(knex.raw).toHaveBeenCalledWith('SELECT');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: 200000,
      message: 'Raw query executed',
      content: [1],
    });
  });

  it('Raw query works fails', async () => {
    const knex = {
      raw: jest.fn().mockRejectedValue([1]),
    } as any as Knex;
    const req = {
      body: {
        dbQuery: 'SELECT',
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.rawQuery(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Raw query, no body', async () => {
    const knex = {
      raw: jest.fn().mockResolvedValue([1]),
    } as any as Knex;
    const req = {
      body: {},
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.rawQuery(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalledWith(
      'Invalid body, dbQuery is required',
      'Invalid body, dbQuery is required',
      400001,
      400,
      'getAll',
      mockNext,
    );
  });

  it('Get all works with no query', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([{ id: 1 }]),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {},
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getAll('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.select).toHaveBeenCalled();
    expect(knex.offset).toHaveBeenCalledWith(0);
    expect(res.json).toHaveBeenCalledWith({
      content: {
        items: [{ id: 1 }],
        pageIndex: 0,
        itemsPerPage: 20,
        totalItems: 1,
        totalPages: 1,
      },
      message: 'success',
      code: 200000,
    });
  });

  it('Get all fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockRejectedValue(new Error('Async error')),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {},
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getAll('table')(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Create works', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      body: {
        inserts: [{ id: 1 }],
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.create('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'success',
      code: 200001,
      content: [1],
    });
  });

  it('Create table', async () => {
    const mockKnex = {
      raw: jest.fn().mockReturnValue([{ warningStatus: 0 }]),
    } as any as Knex;

    const req = {
      body: { tableName: 'test', primaryKeyName: 'x' },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(mockKnex);

    const generationSpy = jest
      .spyOn(CreateTableFromJson.prototype, 'generateCreationStringFromJSON')
      .mockReturnValue('sql statement');

    await conversionHelpers.createTable(req, res, jest.fn());

    expect(mockKnex.raw).toBeCalledWith('sql statement');

    expect(res.json).toHaveBeenCalledWith({
      message: 'Sql Executed',
      code: 200000,
      content: {
        executedSQL: 'sql statement',
      },
    });

    generationSpy.mockRestore();
  });

  it('Create table warning', async () => {
    const mockKnex = {
      raw: jest.fn().mockReturnValue([{ warningStatus: 1 }]),
    } as any as Knex;

    const req = {
      body: { tableName: 'test', primaryKeyName: 'x' },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(mockKnex);

    conversionHelpers.returnError = jest.fn();

    const generationSpy = jest
      .spyOn(CreateTableFromJson.prototype, 'generateCreationStringFromJSON')
      .mockReturnValue('sql statement');

    const mockNext = jest.fn();

    await conversionHelpers.createTable(req, res, mockNext);

    expect(conversionHelpers.returnError).toBeCalledWith(
      'Table could not be created, most likely table already exist',
      'Table could not be created, most likely table already exist',
      400014,
      400,
      'createTable',
      mockNext,
    );

    generationSpy.mockRestore();
  });

  it('Validate create table body', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      body: {
        tableName: 'test',
        columns: {
          table: {
            type: 'x',
          },
        },
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const mockNext = jest.fn();

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    await conversionHelpers.validateCreateTableBody(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('Create works multiple inserts', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      body: {
        inserts: [{ id: 1 }, { id: 2 }],
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.create('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'success',
      code: 200001,
    });
  });

  it('Create fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      insert: jest.fn().mockRejectedValue(new Error('Async error')),
    } as any as Knex;

    const req = {
      body: {
        inserts: [{ id: 1 }],
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.create('table')(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Update one by id works', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.updateOneById('table')(req, res, mockNext);

    expect(knex.where).toHaveBeenCalledWith({ other_id: 1 });
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200001,
    });
  });

  it('Update one by id works no query', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      query: {},
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.updateOneById('table')(req, res, mockNext);

    expect(knex.where).toHaveBeenCalledWith({ id: 1 });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200001,
    });
  });

  it('Update one by id fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockRejectedValue(new Error('Async error')),
    } as any as Knex;

    const req = {
      query: {},
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.updateOneById('table')(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Gets one by id', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getOneById('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.where).toHaveBeenCalledWith({ other_id: 1 });
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200000,
    });
  });

  it('Gets one by id no query', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([1]),
    } as any as Knex;

    const req = {
      query: {},
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getOneById('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200000,
    });
  });

  it('Gets one by id fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error('Async error')),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.getOneById('table')(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Deletes one by id', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockResolvedValue(1),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.deleteOneById('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.where).toHaveBeenCalledWith({ other_id: 1 });
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200001,
    });
  });

  it('Deletes one by id no query', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockResolvedValue(1),
    } as any as Knex;

    const req = {
      query: {},
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.deleteOneById('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(res.json).toHaveBeenCalledWith({
      content: 1,
      message: 'success',
      code: 200001,
    });
  });

  it('Deletes one by id fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockRejectedValue(new Error('Async error')),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.deleteOneById('table')(req, res, mockNext);

    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Deletes one by id fails in data base', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockResolvedValue(0),
    } as any as Knex;

    const req = {
      query: {
        identifierColumn: 'other_id',
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    await conversionHelpers.deleteOneById('table')(req, res, mockNext);

    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.where).toHaveBeenCalledWith({ other_id: 1 });
    expect(conversionHelpers.returnError).toHaveBeenCalledWith(
      'Could not delete from the data base',
      'Could not delete from the data base',
      501001,
      501,
      'deleteOneById',
      mockNext,
    );
  });

  it('Columns to select works', () => {
    const parsedBody = {
      fields: ['id'],
    } as any;

    const localTableSettings = {
      table: ['id', 'xid'],
    };

    const knex = {} as any as Knex;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    const columns = conversionHelpers.columnsToSelect(
      'table',
      localTableSettings,
      parsedBody,
    );

    expect(columns[0]).toBe('id');
  });

  it('Columns to select works, no correct query columns', () => {
    const parsedBody = {
      fields: ['uid'],
    } as any;

    const localTableSettings = {
      table: ['id', 'xid'],
    };

    const knex = {} as any as Knex;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    const columns = conversionHelpers.columnsToSelect(
      'table',
      localTableSettings,
      parsedBody,
    );

    expect(columns[0]).toBe('id');
  });

  it('Query works pagination', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([{ id: 1 }]),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {
        itemsPerPage: 10,
        pageIndex: 1,
      },
      body: {
        fields: ['id'],
        filters: [
          {
            column: 'id',
            value: 1,
            operation: '=',
            negate: false,
            operator: 'and',
          },
        ],
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    conversionHelpers.createFilter = jest.fn().mockReturnValue(knex);

    await conversionHelpers.query('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      content: {
        items: [{ id: 1 }],
        pageIndex: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
      },
      message: 'success',
      code: 200000,
    });
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.select).toBeCalledWith('id');
    expect(knex.limit).toHaveBeenCalledWith(10);
    expect(knex.offset).toHaveBeenCalledWith(10);
    expect(conversionHelpers.createFilter).toHaveBeenCalledTimes(2);
  });

  it('Query works pagination, no filters', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([{ id: 1 }]),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {
        itemsPerPage: 10,
        pageIndex: 1,
      },
      body: {
        fields: ['id'],
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    conversionHelpers.createFilter = jest.fn().mockReturnValue(knex);

    await conversionHelpers.query('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      content: {
        items: [{ id: 1 }],
        pageIndex: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
      },
      message: 'success',
      code: 200000,
    });
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.select).toBeCalledWith('id');
    expect(knex.limit).toHaveBeenCalledWith(10);
    expect(knex.offset).toHaveBeenCalledWith(10);
    expect(conversionHelpers.createFilter).toHaveBeenCalledTimes(2);
  });

  it('Query works pagination no query and no fields', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([{ id: 1 }]),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {},
      body: {
        filters: [
          {
            column: 'id',
            value: 1,
            operation: '=',
            negate: false,
            operator: 'and',
          },
        ],
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    conversionHelpers.createFilter = jest.fn().mockReturnValue(knex);

    await conversionHelpers.query('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      content: {
        items: [{ id: 1 }],
        pageIndex: 0,
        itemsPerPage: 20,
        totalItems: 1,
        totalPages: 1,
      },
      message: 'success',
      code: 200000,
    });
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(knex.limit).toHaveBeenCalledWith(20);
    expect(knex.offset).toHaveBeenCalledWith(0);
    expect(conversionHelpers.createFilter).toHaveBeenCalledTimes(2);
  });

  it('Query works no pagination', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([{ id: 1 }]),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: { pagination: 'false' },
      body: {},
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    conversionHelpers.createFilter = jest.fn().mockReturnValue([{ id: 1 }]);

    await conversionHelpers.query('table')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      content: [{ id: 1 }],
      message: 'success',
      code: 200001,
    });
    expect(knex.table).toHaveBeenCalledWith('table');
    expect(conversionHelpers.createFilter).toHaveBeenCalledTimes(1);
  });

  it('Query fails', async () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockRejectedValue(new Error('Async error')),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ 'count(*)': 1 }]),
    } as any as Knex;

    const req = {
      query: {
        itemsPerPage: 10,
        pageIndex: 1,
      },
      body: {
        fields: ['id'],
        filters: [
          {
            column: 'id',
            value: 1,
            operation: '=',
            negate: false,
            operator: 'and',
          },
        ],
      },
      params: {
        id: 1,
      },
    } as any as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    const mockNext = jest.fn();

    conversionHelpers.createFilter = jest.fn().mockReturnValue(knex);

    await conversionHelpers.query('table')(req, res, mockNext);
    expect(conversionHelpers.returnError).toHaveBeenCalled();
  });

  it('Create Filter', () => {
    const knex = {
      table: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      whereNot: jest.fn().mockReturnThis(),
      orWhereNot: jest.fn().mockReturnThis(),
      orWhereIn: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      orWhereNotIn: jest.fn().mockReturnThis(),
      orWhereBetween: jest.fn().mockReturnThis(),
      whereBetween: jest.fn().mockReturnThis(),
      whereNotBetween: jest.fn().mockReturnThis(),
      orWhereNotBetween: jest.fn().mockReturnThis(),
      orWhereNull: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      orWhereNotNull: jest.fn().mockReturnThis(),
    } as any as Knex;

    const conversionHelpers = new ConversionHelpers(knex);

    conversionHelpers.returnError = jest.fn();

    conversionHelpers.createFilter(
      [
        {
          column: 'c1',
          value: 1,
          operation: '=',
          negate: false,
          operator: 'and',
        },
        {
          column: 'c2',
          value: 1,
          operation: '>',
          negate: true,
          operator: 'or',
        },
        {
          column: 'c3',
          value: 1,
          operation: '<>',
          negate: true,
          operator: 'or',
        },
        {
          column: 'c4',
          value: 1,
          operation: 'in',
          negate: true,
          operator: 'and',
        },
        {
          column: 'c5',
          value: 1,
          operation: 'in',
          negate: false,
          operator: 'or',
        },
        {
          column: 'c6',
          value: 1,
          operation: 'between',
          negate: false,
          operator: 'or',
        },
        {
          column: 'c7',
          value: 1,
          operation: 'null',
          negate: false,
          operator: 'or',
        },
        {
          column: 'c8',
          value: 1,
          operation: 'x' as '=',
          negate: false,
          operator: 'or',
        },
        {
          column: 'c8',
          value: 1,
          operation: 'null',
          negate: true,
          operator: 'or',
        },
        {
          column: 'c9',
          value: 1,
          operation: '<',
          negate: false,
          operator: 'and',
        },
        {
          column: 'c10',
          value: 1,
          operation: '<=',
          negate: false,
          operator: 'and',
        },
        {
          column: 'c11',
          value: 1,
          operation: '>=',
          negate: false,
          operator: 'and',
        },
      ],
      knex as any as Knex.QueryBuilder,
    );

    expect(knex.where).toHaveBeenCalledWith('c1', '=', 1);
    expect(knex.where).toHaveBeenCalledWith('c9', '<', 1);
    expect(knex.where).toHaveBeenCalledWith('c10', '<=', 1);
    expect(knex.where).toHaveBeenCalledWith('c11', '>=', 1);
    expect(knex.orWhereNot).toHaveBeenCalledWith('c2', '>', 1);
    expect(knex.whereNotIn).toHaveBeenCalledWith('c4', 1);
    expect(knex.orWhereIn).toHaveBeenCalledWith('c5', 1);
    expect(knex.orWhereBetween).toHaveBeenCalledWith('c6', 1);
    expect(knex.orWhereNull).toHaveBeenCalledWith('c7');
    expect(knex.orWhereNotNull).toHaveBeenCalledWith('c8');
  });

  it('Error function', () => {
    const knex = {} as any as Knex;
    const conversionHelpers = new ConversionHelpers(knex);

    const nextErrorMock = jest.fn();

    conversionHelpers.returnError(
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
      onFile: 'ConversionHelpers.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: undefined,
    });

    conversionHelpers.returnError(
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
      onFile: 'ConversionHelpers.ts',
      logMessage: 'some error',
      errorObject: true,
      originalError: undefined,
    });

    conversionHelpers.returnError(
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
      onFile: 'ConversionHelpers.ts',
      logMessage: 'some error',
      errorObject: undefined,
      originalError: { sqlState: true },
    });
  });
});
