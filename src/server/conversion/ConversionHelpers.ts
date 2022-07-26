import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { Knex } from 'knex';
import tableSettings from '../../tableSettings';
import CreateTableFromJson from '../util/CreateTableFromJson';
import ErrorForNext from '../util/ErrorForNext';
import {
  Filter,
  QueryBody,
  TableCreationBody,
} from './../dtos/ConversionHelpersInterfaces';

class ConversionHelpers {
  knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
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
      'ConversionHelpers.ts',
    ).setLogMessage(logMessage);

    if (error && error.response === undefined)
      errorForNext.setOriginalError(error);

    if (error && error.response) errorForNext.setErrorObject(error.response);

    if (error && error.sqlState)
      errorForNext.setMessage(`Data base error. ${message}`);

    return next(errorForNext.toJSON());
  };

  validateCreateTableBody = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const tableCreationBody = new TableCreationBody();
      tableCreationBody.tableName = req.body.tableName;
      tableCreationBody.columns = req.body.columns;
      tableCreationBody.primaryKeyName = req.body.primaryKeyName;
      const errors = await validate(tableCreationBody);
      if (errors.length > 0) {
        const fullMessage = errors.filter((err) =>
          JSON.stringify(err.constraints || {}),
        );
        return this.returnError(
          `Invalid body. ${fullMessage}`,
          `Invalid body. ${fullMessage}`,
          400003,
          400,
          'validateCreateTableBody',
          next,
          errors,
        );
      }
      next();
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500013,
        500,
        'validateCreateTableBody',
        next,
        error,
      );
    }
  };

  createTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const talbleCreationBody = req.body as TableCreationBody;

      const table = new CreateTableFromJson(
        talbleCreationBody.tableName,
        talbleCreationBody.primaryKeyName,
      );

      const creationString = table.generateCreationStringFromJSON(
        talbleCreationBody.columns,
      );

      const result = await this.knex.raw(creationString);

      if (result[0] && result[0].warningStatus > 0) {
        return this.returnError(
          'Table could not be created, most likely table already exist',
          'Table could not be created, most likely table already exist',
          400014,
          400,
          'createTable',
          next,
        );
      }

      return res.json({
        message: 'Sql Executed',
        code: 200000,
        content: {
          executedSQL: creationString,
        },
      });
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500011,
        500,
        'createTable',
        next,
        error,
      );
    }
  };

  rawQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbQuery = req.body.dbQuery;

      if (dbQuery === undefined) {
        return this.returnError(
          'Invalid body, dbQuery is required',
          'Invalid body, dbQuery is required',
          400001,
          400,
          'getAll',
          next,
        );
      }

      const result = await this.knex.raw(dbQuery);

      return res.status(201).json({
        code: 200000,
        message: 'Raw query executed',
        content: result,
      });
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500010,
        500,
        'rawQuery',
        next,
        error,
      );
    }
  };

  getAll = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let orderType = 'asc';
        let orderByColumn = 'id';
        let itemsPerPage = 20;
        let pageIndex = 0;

        if (
          req.query['itemsPerPage'] &&
          parseInt(req.query['itemsPerPage'] as string) >= 1
        ) {
          itemsPerPage = parseInt(req.query['itemsPerPage'] as string);
        }

        if (
          req.query['pageIndex'] &&
          parseInt(req.query['pageIndex'] as string) >= 0
        ) {
          pageIndex = parseInt(req.query['pageIndex'] as string);
        }

        if (req.query['orderType'] && req.query['orderType'] === 'desc') {
          orderType = req.query['orderType'] as string;
        }

        if (req.query['orderByColumn']) {
          orderByColumn = req.query['orderByColumn'] as string;
        }

        const offset = itemsPerPage * pageIndex;

        const totalCount = (await this.knex.table(tableName).count())[0][
          'count(*)'
        ] as number;

        const totalPages = Math.ceil(totalCount / itemsPerPage);

        const columnsToSelect = tableSettings[tableName] || [];

        const result = await this.knex
          .table(tableName)
          .select(...columnsToSelect)
          .limit(itemsPerPage)
          .offset(offset)
          .orderBy(orderByColumn, orderType);

        return res.status(200).json({
          content: {
            items: result,
            pageIndex,
            itemsPerPage,
            totalItems: totalCount,
            totalPages,
          },
          message: 'success',
          code: 200000,
        });
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500001,
          500,
          'getAll',
          next,
          error,
        );
      }
    };
  };

  create = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.knex
          .table(tableName)
          .insert([...req.body.inserts]);
        const responseObj: Record<string, any> = {
          message: 'success',
          code: 200001,
        };
        if ([...req.body.inserts].length === 1) {
          responseObj.content = result;
        }
        return res.status(201).json(responseObj);
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500002,
          500,
          'create',
          next,
          error,
        );
      }
    };
  };

  updateOneById = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let identifierColumn = 'id';
        if (req.query['identifierColumn']) {
          identifierColumn = req.query['identifierColumn'] as string;
        }
        const result = await this.knex
          .table(tableName)
          .where({ [identifierColumn]: req.params.id })
          .update(req.body, []);
        return res.status(201).json({
          content: result[0],
          message: 'success',
          code: 200001,
        });
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500003,
          500,
          'updateOneById',
          next,
          error,
        );
      }
    };
  };

  getOneById = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let identifierColumn = 'id';
        if (req.query['identifierColumn']) {
          identifierColumn = req.query['identifierColumn'] as string;
        }
        const columnToSelect = tableSettings[tableName] || [];
        const result = await this.knex
          .table(tableName)
          .select(...columnToSelect)
          .where({ [identifierColumn]: req.params.id });
        return res.status(200).json({
          content: result[0],
          message: 'success',
          code: 200000,
        });
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500004,
          500,
          'getOneById',
          next,
          error,
        );
      }
    };
  };

  deleteOneById = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let identifierColumn = 'id';
        if (req.query['identifierColumn']) {
          identifierColumn = req.query['identifierColumn'] as string;
        }

        const result = await this.knex
          .table(tableName)
          .where({ [identifierColumn]: req.params.id })
          .del();

        if (result !== 1) {
          return this.returnError(
            'Could not delete from the data base',
            'Could not delete from the data base',
            501001,
            501,
            'deleteOneById',
            next,
          );
        }

        return res.status(201).json({
          content: req.params.id,
          message: 'success',
          code: 200001,
        });
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500005,
          500,
          'deleteOneById',
          next,
          error,
        );
      }
    };
  };

  columnsToSelect = (
    tableName: string,
    localTableSettings: Record<string, string[]>,
    parsedBody: QueryBody,
  ) => {
    let columnsToSelect = [] as string[];

    const columnsToSelectBySettings = localTableSettings[tableName] || [];
    const columnsToSelectByQuery = parsedBody.fields || [];

    if (columnsToSelectByQuery.length === 0) {
      columnsToSelect = [...columnsToSelectBySettings];
    } else if (columnsToSelectBySettings.length > 0) {
      for (const column of columnsToSelectByQuery) {
        const indexOfColumn = columnsToSelectBySettings.indexOf(column);
        if (indexOfColumn > -1) {
          columnsToSelect.push(column);
        }
      }
      if (columnsToSelect.length === 0) {
        columnsToSelect = [...columnsToSelectBySettings];
      }
    } else {
      columnsToSelect = [...columnsToSelectByQuery];
    }

    return columnsToSelect;
  };

  query = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let pagination = true;
        let itemsPerPage = 20;
        let pageIndex = 0;

        const parsedBody = req.body as QueryBody;

        if (parsedBody.pagination === undefined) {
          if (req.query['pagination'] && req.query['pagination'] === 'false')
            pagination = false;

          if (
            req.query['itemsPerPage'] &&
            parseInt(req.query['itemsPerPage'] as string) >= 1
          ) {
            itemsPerPage = parseInt(req.query['itemsPerPage'] as string);
          }

          if (
            req.query['pageIndex'] &&
            parseInt(req.query['pageIndex'] as string) >= 0
          ) {
            pageIndex = parseInt(req.query['pageIndex'] as string);
          }
        } else {
          pagination = parsedBody.pagination.pagination;
          itemsPerPage = parsedBody.pagination.itemsPerPage;
          pageIndex = parsedBody.pagination.pageIndex;
        }

        const columnsToSelect = this.columnsToSelect(
          tableName,
          tableSettings,
          parsedBody,
        );

        const baseQuery = this.knex.table(tableName).select(...columnsToSelect);

        let query = this.createFilter(parsedBody.filters || [], baseQuery);

        if (pagination) {
          const countBaseQuery = this.knex
            .table(tableName)
            .select(...columnsToSelect);
          const countQuery = this.createFilter(
            parsedBody.filters || [],
            countBaseQuery,
          ).count();
          const offset = itemsPerPage * pageIndex;
          if (itemsPerPage > -1) {
            query = query.limit(itemsPerPage).offset(offset);
          }
          if (parsedBody.sort) {
            query = query.orderBy(
              parsedBody.sort.byColumn,
              parsedBody.sort.direction,
            );
          }
          const count = (await countQuery)[0]['count(*)'];
          const totalPages = Math.ceil(count / itemsPerPage);
          const itemsResult = await query;
          return res.status(200).json({
            content: {
              items: itemsResult,
              pageIndex,
              itemsPerPage,
              totalItems: count,
              totalPages,
            },
            message: 'success',
            code: 200000,
          });
        }

        const result = await query;
        return res
          .status(200)
          .json({ content: result, message: 'success', code: 200001 });
      } catch (error) {
        return this.returnError(
          error.message,
          error.message,
          500006,
          500,
          'query',
          next,
          error,
        );
      }
    };
  };

  createFilter = (filters: Filter[], queryBase: Knex.QueryBuilder) => {
    let query = queryBase;
    for (const filter of filters) {
      if (filter.negate === 'false') {
        filter.negate = false;
      }

      if (filter.negate === 'true') {
        filter.negate = true;
      }

      const baseWhereQuery = filter.operator === 'and' ? 'where' : 'orWhere';
      const whereQuery = filter.negate
        ? `${baseWhereQuery}Not`
        : baseWhereQuery;
      switch (filter.operation) {
        case '<':
        case '>':
        case '=':
        case '<=':
        case '>=':
        case '<>':
        case 'like':
          query = query[
            whereQuery as 'orWhere' | 'where' | 'whereNot' | 'orWhereNot'
          ](
            filter.column,
            filter.operation,
            filter.operation === 'like'
              ? '%' + filter.value + '%'
              : filter.value,
          );
          break;
        case 'in':
          const queryFunctionWhereIn = `${whereQuery}In`;
          query = query[
            queryFunctionWhereIn as
              | 'orWhereIn'
              | 'whereIn'
              | 'whereNotIn'
              | 'orWhereNotIn'
          ](filter.column, filter.value);
          break;
        case 'between':
          const queryFunctionWhereBetween = `${whereQuery}Between`;
          query = query[
            queryFunctionWhereBetween as
              | 'orWhereBetween'
              | 'whereBetween'
              | 'whereNotBetween'
              | 'orWhereNotBetween'
          ](filter.column, filter.value);
          break;
        case 'null':
          const queryFunctionWhereNull = `${whereQuery}Null`;
          query = query[
            queryFunctionWhereNull as
              | 'orWhereNull'
              | 'whereNull'
              | 'whereNotNull'
              | 'orWhereNotNull'
          ](filter.column);
          break;
        default:
          break;
      }
    }
    return query;
  };
}

export default ConversionHelpers;
