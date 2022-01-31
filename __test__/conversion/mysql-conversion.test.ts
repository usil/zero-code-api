import { Knex } from 'knex';
import MySqlConversion from '../../src/server/conversion/MysqlConversion';

describe('Description', () => {
  it('Get tables works', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = 'test'`;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTables();

    expect(knex.schema.raw).toHaveBeenCalledWith(sqlStatement);

    expect(error).toBe(null);
    expect(result).toStrictEqual({
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
    });
  });

  it('Get tables works occult system table', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: true,
    } as any;

    let sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = 'test'`;

    const occultSystemTablesSql = ` AND substring(table_name, 1, 7) <> 'OAUTH2_'`;

    sqlStatement += occultSystemTablesSql;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTables();

    expect(knex.schema.raw).toHaveBeenCalledWith(sqlStatement);

    expect(error).toBe(null);
    expect(result).toStrictEqual({
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
    });
  });

  it('Get tables fails', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockRejectedValue(new Error('Some Error')),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: true,
    } as any;

    let sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = 'test'`;

    const occultSystemTablesSql = ` AND substring(table_name, 1, 7) <> 'OAUTH2_'`;

    sqlStatement += occultSystemTablesSql;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTables();

    expect(knex.schema.raw).toHaveBeenCalledWith(sqlStatement);

    expect(error).toBe('Some Error');
    expect(result).toStrictEqual(null);
  });

  it('Get table works', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          [
            {
              table_name: 'table',
              table_comment: 'comment',
              table_schema: 'schema',
            },
          ],
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const tableName = 'table';
    const dataBaseName = 'test';

    const sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = '${dataBaseName}' AND table_name = '${tableName}'`;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTable('table');

    expect(knex.schema.raw).toHaveBeenCalledWith(sqlStatement);

    expect(error).toBe(null);

    expect(result).toStrictEqual({
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
    });
  });

  it('Get table works fails', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockRejectedValue(new Error('Async error')),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const tableName = 'table';
    const dataBaseName = 'test';

    const sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = '${dataBaseName}' AND table_name = '${tableName}'`;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTable('table');

    expect(knex.schema.raw).toHaveBeenCalledWith(sqlStatement);

    expect(error).toBe('Async error');

    expect(result).toStrictEqual(null);
  });

  it('Get full table works', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTable = jest.fn().mockResolvedValue([
      {
        table_name: 'table',
        table_comment: 'comment',
        table_schema: 'schema',
      },
      ,
      null,
    ]);

    mysqlConversion.getTableColumns = jest.fn().mockResolvedValue([
      [
        {
          column_name: 'column',
          column_default: 'default',
          is_nullable: '1',
          data_type: 'int',
          column_type: 'int',
          extra: 'extra',
          column_comment: 'comment',
          column_key: 'PRI',
        },
      ],
      null,
    ]);

    const [result, error] = await mysqlConversion.getFullTable('table');

    expect(mysqlConversion.getTable).toHaveBeenCalledWith('table');
    expect(mysqlConversion.getTableColumns).toHaveBeenCalled();

    expect(error).toBe(null);
    expect(result).toStrictEqual({
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
      columns: [
        {
          column_name: 'column',
          column_default: 'default',
          is_nullable: '1',
          data_type: 'int',
          column_type: 'int',
          extra: 'extra',
          column_comment: 'comment',
          column_key: 'PRI',
        },
      ],
    });
  });

  it('Get full table works get table errors', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTable = jest
      .fn()
      .mockResolvedValue([null, 'Some error']);

    mysqlConversion.getTableColumns = jest.fn().mockResolvedValue([
      [
        {
          column_name: 'column',
          column_default: 'default',
          is_nullable: '1',
          data_type: 'int',
          column_type: 'int',
          extra: 'extra',
          column_comment: 'comment',
          column_key: 'PRI',
        },
      ],
      null,
    ]);

    const [result, error] = await mysqlConversion.getFullTable('table');

    expect(error).not.toBe(null);
  });

  it('Get full table fails', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTable = jest
      .fn()
      .mockRejectedValue(new Error('Async error'));

    mysqlConversion.getTableColumns = jest.fn().mockResolvedValue([
      [
        {
          column_name: 'column',
          column_default: 'default',
          is_nullable: '1',
          data_type: 'int',
          column_type: 'int',
          extra: 'extra',
          column_comment: 'comment',
          column_key: 'PRI',
        },
      ],
      null,
    ]);

    const [result, error] = await mysqlConversion.getFullTable('table');

    expect(mysqlConversion.getTable).toHaveBeenCalledWith('table');

    expect(error).toBeTruthy();
    expect(result).toStrictEqual(null);
  });

  it('Get full table works get table columns fails', async () => {
    const knex = {
      schema: {
        raw: jest.fn().mockResolvedValue([
          {
            table_name: 'table',
            table_comment: 'comment',
            table_schema: 'schema',
          },
        ]),
      },
    } as any as Knex;

    const configuration = {
      dataBaseName: 'test',
      occultSystemTables: false,
    } as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTable = jest.fn().mockResolvedValue([
      {
        table_name: 'table',
        table_comment: 'comment',
        table_schema: 'schema',
      },
      ,
      null,
    ]);

    mysqlConversion.getTableColumns = jest
      .fn()
      .mockResolvedValue([null, 'Some error']);

    const [result, error] = await mysqlConversion.getFullTable('table');

    expect(error).not.toBe(null);
  });

  it('Get table columns', async () => {
    const dataBaseName = 'test';
    const tableName = 'table';
    const selectColumnsInfoQuery = `SELECT column_name, column_default, is_nullable, data_type, column_type, extra, column_comment, column_key 
        FROM information_schema.COLUMNS
        WHERE table_schema = '${dataBaseName}' 
        AND table_name = '${tableName}'`;

    const selectTableColumnsRelationsInfoQuery = `SELECT
    column_name,
    referenced_table_schema,
    referenced_table_name,
    referenced_column_name
  FROM
    information_schema.key_column_usage
  WHERE
    table_schema = '${dataBaseName}'
    AND referenced_table_name IS NOT NULL
    AND table_name = '${tableName}'`;

    const knex = {
      raw: jest
        .fn()
        .mockResolvedValueOnce([
          [
            {
              column_name: 'column',
              column_default: 'default',
              is_nullable: '1',
              data_type: 'int',
              column_type: 'int',
              extra: 'extra',
              column_comment: 'comment',
              column_key: 'PRI',
            },
          ],
        ])
        .mockResolvedValueOnce([[{ referenced_table_schema: 'same' }]]),
    } as any as Knex;

    const table = {
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
    };

    const configuration = {
      dataBaseName,
    };

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTableColumns(table);

    expect(knex.raw).toHaveBeenCalledWith(selectColumnsInfoQuery);
    expect(knex.raw).toHaveBeenCalledTimes(2);
    expect(result[0]).toStrictEqual({
      column_name: 'column',
      column_default: 'default',
      is_nullable: '1',
      data_type: 'int',
      column_type: 'int',
      extra: 'extra',
      column_comment: 'comment',
      column_key: 'PRI',
    });
    expect(error).toBe(null);
  });

  it('Get table columns fails', async () => {
    const dataBaseName = 'test';
    const knex = {
      raw: jest.fn().mockReturnValueOnce(new Error('Async error')),
    } as any as Knex;

    const table = {
      table_name: 'table',
      table_comment: 'comment',
      table_schema: 'schema',
    };

    const configuration = {
      dataBaseName,
    };

    const mysqlConversion = new MySqlConversion(knex, configuration);

    const [result, error] = await mysqlConversion.getTableColumns(table);

    expect(result).toBe(null);
    expect(error).toBeTruthy();
  });

  it('Gets all table columns', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTableColumns = jest.fn().mockResolvedValue([
      [
        {
          column_name: 'column',
          column_default: 'default',
          is_nullable: '1',
          data_type: 'int',
          column_type: 'int',
          extra: 'extra',
          column_comment: 'comment',
          column_key: 'PRI',
        },
      ],
    ]);
    mysqlConversion.getTables = jest.fn().mockResolvedValue([
      [
        {
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        },
      ],
      null,
    ]);
    await mysqlConversion.getAllTablesColumns();
    expect(mysqlConversion.getTables).toHaveBeenCalled();
    expect(mysqlConversion.getTableColumns).toHaveBeenCalledTimes(1);
  });

  it('Gets all table columns local tables error', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTableColumns = jest.fn().mockResolvedValue([
      {
        column_name: 'column',
        column_default: 'default',
        is_nullable: '1',
        data_type: 'int',
        column_type: 'int',
        extra: 'extra',
        column_comment: 'comment',
        column_key: 'PRI',
      },
    ]);
    mysqlConversion.getTables = jest
      .fn()
      .mockResolvedValue([null, 'Some error']);
    const result = await mysqlConversion.getAllTablesColumns();
    expect(result[0]).toBeNull();
  });

  it('Gets all table columns not columns', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTableColumns = jest
      .fn()
      .mockResolvedValue([null, 'Some Error']);
    mysqlConversion.getTables = jest.fn().mockResolvedValue([
      [
        {
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        },
      ],
      null,
    ]);
    const result = await mysqlConversion.getAllTablesColumns();
    expect(result[0]).toBeNull();
  });

  it('Gets all table columns fails', async () => {
    const knex = {} as any as Knex;
    const configuration = {} as any;

    const mysqlConversion = new MySqlConversion(knex, configuration);

    mysqlConversion.getTableColumns = jest
      .fn()
      .mockRejectedValue(new Error('Async Error'));
    mysqlConversion.getTables = jest.fn().mockResolvedValue([
      [
        {
          table_name: 'table',
          table_comment: 'comment',
          table_schema: 'schema',
        },
      ],
      null,
    ]);
    const result = await mysqlConversion.getAllTablesColumns();
    expect(result[0]).toBeNull();
  });
});
