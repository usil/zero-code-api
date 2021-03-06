import { ConfigGlobalDto } from '../../../config/config.dto';
import { Request, Response } from 'express';
import { Knex } from 'knex';
import MysqlConversion, { Column, FullTable } from './MysqlConversion';
import tableSettings from '../../tableSettings';

class GeneralHelpers {
  knex: Knex;
  configuration: Partial<ConfigGlobalDto>;

  constructor(knex: Knex, configuration: Partial<ConfigGlobalDto>) {
    this.knex = knex;
    this.configuration = configuration;
  }

  getAllTables = async (_req: Request, res: Response) => {
    try {
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [tables, error] = await mysqlConversion.getTables();
      if (error) {
        return res.status(500).json({ message: error, code: 500000 });
      }
      return res
        .status(200)
        .json({ message: 'Tables selected', code: 200000, content: tables });
    } catch (error) {
      return res.status(500).json({ message: error.message, code: 500000 });
    }
  };

  columnsToSelect = (
    tableName: string,
    localTableSettings: Record<string, string[]>,
    fullTable: FullTable,
  ): Column[] => {
    const columnsToSelect = localTableSettings[tableName] || [];

    if (columnsToSelect.length === 0) {
      return fullTable.columns;
    }

    const newColumns = [];

    for (const column of fullTable.columns) {
      const columnIndex = columnsToSelect.indexOf(column.column_name);
      if (columnIndex > -1) newColumns.push(column);
    }

    return newColumns;
  };

  getFullTable = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.tableName;
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [fullTable, error] = await mysqlConversion.getFullTable(tableName);
      if (error) {
        return res.status(500).json({ message: error, code: 500000 });
      }

      fullTable.columns = this.columnsToSelect(
        tableName,
        tableSettings,
        fullTable,
      );

      return res
        .status(200)
        .json({ message: 'Table selected', code: 200000, content: fullTable });
    } catch (error) {
      return res.status(500).json({ message: error.message, code: 500000 });
    }
  };
}

export default GeneralHelpers;
