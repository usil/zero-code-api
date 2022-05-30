import { Knex } from 'knex';
import { ConfigGlobalDto } from '../../../config/config.dto';

interface Table {
  table_name: string;
  table_comment?: string;
  table_schema: string;
}

export interface FullTable {
  table_name: string;
  table_comment?: string;
  table_schema: string;
  columns: Column[];
}

export interface Column {
  column_name: string;
  column_default: string;
  is_nullable: string;
  data_type: string;
  column_type: string;
  extra: string;
  column_comment: string;
  column_key: string;
  referenced_table_schema?: string;
  referenced_table_name?: string;
  referenced_column_name?: string;
}

class MySqlConversion {
  knex: Knex;
  configuration: Partial<ConfigGlobalDto>;
  tables: Table[];
  tablesColumns: Record<string, Column[]>;

  constructor(knex: Knex, configuration: Partial<ConfigGlobalDto>) {
    this.knex = knex;
    this.configuration = configuration;
  }

  async getTables(): Promise<[Table[], null] | [null, string]> {
    try {
      let sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = '${this.configuration.dataBaseName}'`;
      const occultSystemTablesSql = ` AND substring(table_name, 1, 7) <> 'OAUTH2_'`;
      if (this.configuration.occultSystemTables) {
        sqlStatement += occultSystemTablesSql;
      }
      const tablesPreParse = (await this.knex.schema.raw(
        sqlStatement,
      )) as any as any[];
      const tables = tablesPreParse[0] as Table[];
      return [tables, null];
    } catch (error) {
      this.configuration.log().error(error.message);
      return [null, error.message];
    }
  }

  async getTable(tableName: string): Promise<[Table, null] | [null, string]> {
    try {
      const sqlStatement = `SELECT table_name, table_comment, table_schema 
      FROM information_schema.tables WHERE table_schema = '${this.configuration.dataBaseName}' AND table_name = '${tableName}'`;
      const tablesPreParse = (await this.knex.schema.raw(
        sqlStatement,
      )) as any as any[];
      const table = tablesPreParse[0] as Table[];
      return [table[0], null];
    } catch (error) {
      return [null, error.message];
    }
  }

  async getFullTable(
    tableName: string,
  ): Promise<[FullTable, null] | [null, string]> {
    try {
      const [table, error] = await this.getTable(tableName);
      if (error) return [null, error];
      const [columns, errorColumns] = await this.getTableColumns(table);
      if (errorColumns) return [null, errorColumns];
      return [
        {
          table_name: tableName,
          table_comment: table.table_comment,
          table_schema: table.table_schema,
          columns,
        },
        null,
      ];
    } catch (error) {
      console.error(error);
      return [null, error.message];
    }
  }

  async getTableColumns(
    table: Table,
  ): Promise<[Column[], null] | [null, string]> {
    try {
      const selectColumnsInfoQuery = `SELECT column_name, column_default, is_nullable, data_type, column_type, extra, column_comment, column_key 
        FROM information_schema.COLUMNS
        WHERE table_schema = '${this.configuration.dataBaseName}' 
        AND table_name = '${table.table_name}'`;
      const tableColumnsInfo = await this.knex.raw(selectColumnsInfoQuery);
      const selectTableColumnsRelationsInfoQuery = `SELECT
      column_name,
      referenced_table_schema,
      referenced_table_name,
      referenced_column_name
    FROM
      information_schema.key_column_usage
    WHERE
      table_schema = '${this.configuration.dataBaseName}'
      AND referenced_table_name IS NOT NULL
      AND table_name = '${table.table_name}'`;
      const tableColumnsRelationsInfo = await this.knex.raw(
        selectTableColumnsRelationsInfoQuery,
      );
      for (const column of tableColumnsRelationsInfo[0]) {
        const index = tableColumnsInfo[0].findIndex(
          (c: any) => c.column_name === column.column_name,
        );
        tableColumnsInfo[0][index] = {
          ...tableColumnsInfo[0][index],
          ...column,
        };
      }
      const columns = tableColumnsInfo[0] as Column[];
      return [columns, null];
    } catch (error) {
      console.error(error);
      return [null, error.message];
    }
  }

  async getAllTablesColumns(): Promise<
    | [{ tables: Table[]; tablesColumns: Record<string, Column[]> }, null]
    | [null, string]
  > {
    try {
      const [localTables, error] = await this.getTables();
      if (localTables === null) return [null, error];
      this.tables = localTables;
      const tablesColumns: Record<string, any[]> = {};
      for (const table of this.tables) {
        const [columns, getTablesError] = await this.getTableColumns(table);
        if (columns === null) return [null, getTablesError];
        tablesColumns[table.table_name] = columns;
      }
      this.tablesColumns = tablesColumns;
      return [{ tables: this.tables, tablesColumns: this.tablesColumns }, null];
    } catch (error) {
      return [null, error.message];
    }
  }
}

export default MySqlConversion;
