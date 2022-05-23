import { ConfigGlobalDto } from '../../../config/config.dto';
import { NextFunction, Request, Response } from 'express';
import { Knex } from 'knex';
import MysqlConversion, { Column, FullTable } from './MysqlConversion';
import tableSettings from '../../tableSettings';
import ErrorForNext from '../util/ErrorForNext';

class GeneralHelpers {
  knex: Knex;
  configuration: Partial<ConfigGlobalDto>;

  constructor(knex: Knex, configuration: Partial<ConfigGlobalDto>) {
    this.knex = knex;
    this.configuration = configuration;
  }

  returnError = (
    message: string,
    logMessage: string,
    errorCode: number,
    statusCode: number,
    onFunction: string,
    next: NextFunction,
    error?: any,
  ) => {
    const errorForNext = new ErrorForNext(
      message,
      statusCode,
      errorCode,
      onFunction,
      'GeneralHelpers.ts',
    ).setLogMessage(logMessage);

    if (error && error.response === undefined)
      errorForNext.setOriginalError(error);

    if (error && error.response) errorForNext.setErrorObject(error.response);

    if (error && error.sqlState)
      errorForNext.setMessage(`Data base error. ${message}`);

    return next(errorForNext.toJSON());
  };

  getAllTables = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [tables, error] = await mysqlConversion.getTables();
      if (error) {
        return this.returnError(
          error,
          error,
          500101,
          500,
          'getAllTables',
          next,
        );
      }
      return res
        .status(200)
        .json({ message: 'Tables selected', code: 200000, content: tables });
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500101,
        500,
        'getAllTables',
        next,
        error,
      );
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

  getFullTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tableName = req.params.tableName;
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [fullTable, error] = await mysqlConversion.getFullTable(tableName);
      if (error) {
        return this.returnError(
          error,
          error,
          500101,
          500,
          'getFullTable',
          next,
        );
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
      return this.returnError(
        error.message,
        error.message,
        500101,
        500,
        'getFullTable',
        next,
        error,
      );
    }
  };
}

export default GeneralHelpers;
