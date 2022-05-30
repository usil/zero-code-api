import { Knex } from 'knex';
import CreateTableFromJson from '../../src/server/util/CreateTableFromJson';

describe('Createa table from json', () => {
  it('Creates an creation class', () => {
    const table = new CreateTableFromJson('test', undefined);
    expect(table.tableName).toBe('test');
    expect(table.primaryKeyName).toBe('id');
    expect(table.baseStatement).toBe(
      'CREATE TABLE IF NOT EXISTS test(\nid INT UNSIGNED NOT NULL AUTO_INCREMENT',
    );
  });

  it('Creates an creation class custom PK name', () => {
    const table = new CreateTableFromJson('test', 'X');
    expect(table.tableName).toBe('test');
    expect(table.primaryKeyName).toBe('X');
    expect(table.baseStatement).toBe(
      'CREATE TABLE IF NOT EXISTS test(\nX INT UNSIGNED NOT NULL AUTO_INCREMENT',
    );
  });

  it('Parse default value', () => {
    const table = new CreateTableFromJson('test', undefined);
    const resultOne = table.parseDefaultValue(undefined);
    expect(resultOne).toBe('');
    const resultTwo = table.parseDefaultValue('string');
    expect(resultTwo).toBe(` DEFAULT 'string'`);
    const resultThree = table.parseDefaultValue(1);
    expect(resultThree).toBe(` DEFAULT 1`);
  });

  it('Generate Creation String From JSON', () => {
    const table = new CreateTableFromJson('test', undefined);
    const resultOne = table.generateCreationStringFromJSON({
      test: {
        type: 'INT',
      },
    });

    expect(resultOne).toBe(
      'CREATE TABLE IF NOT EXISTS test(\nid INT UNSIGNED NOT NULL AUTO_INCREMENT,\ntest INT NULL,\nCONSTRAINT PK_test PRIMARY KEY (id)\n);',
    );
  });

  it('Generate Creation String From JSON, complete table', () => {
    const table = new CreateTableFromJson('test', undefined);
    const resultOne = table.generateCreationStringFromJSON({
      test: {
        type: 'VARCHAR',
        lenght: 45,
        isNotNulleable: true,
        isUnique: true,
        isUnsigned: true,
        comment: 'comment',
        defaultValue: 'test',
        reference: {
          table: 'referenceTable',
          column: 'id',
        },
      },
    });

    expect(resultOne).toBe(
      `CREATE TABLE IF NOT EXISTS test(\nid INT UNSIGNED NOT NULL AUTO_INCREMENT,\ntest VARCHAR(45) UNSIGNED NOT NULL DEFAULT 'test' COMMENT 'comment',\nCONSTRAINT PK_test PRIMARY KEY (id),\nCONSTRAINT UC_test_test UNIQUE (test),\nCONSTRAINT FK_referenceTable_test FOREIGN KEY (test)\nREFERENCES referenceTable(id)\n);`,
    );
  });
});
