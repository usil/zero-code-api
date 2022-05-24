import { NextFunction, Request, Response } from 'express';
import { Knex } from 'knex';
import tableSettings from '../../tableSettings';
import ErrorForNext from '../util/ErrorForNext';

class QueryBody {
  filters: Filter[];
  fields?: string[];
}

class Filter {
  column: string;
  value: any;
  operation: '<' | '>' | '=' | '<=' | '>=' | '<>' | 'in' | 'between' | 'null';
  negate: boolean;
  operator: 'and' | 'or';
}

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
        500001,
        500,
        'getAll',
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

        const parsedBody = req.body as QueryBody;

        const columnsToSelect = this.columnsToSelect(
          tableName,
          tableSettings,
          parsedBody,
        );

        const baseQuery = this.knex.table(tableName).select(...columnsToSelect);

        const query = this.createFilter(parsedBody.filters || [], baseQuery);

        if (pagination) {
          const countBaseQuery = this.knex
            .table(tableName)
            .select(...columnsToSelect);
          const countQuery = this.createFilter(
            parsedBody.filters || [],
            countBaseQuery,
          ).count();
          const offset = itemsPerPage * pageIndex;
          const paginationQuery = query.limit(itemsPerPage).offset(offset);
          const count = (await countQuery)[0]['count(*)'];
          const totalPages = Math.ceil(count / itemsPerPage);
          const itemsResult = await paginationQuery;
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
          query = query[
            whereQuery as 'orWhere' | 'where' | 'whereNot' | 'orWhereNot'
          ](filter.column, filter.operation, filter.value);
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
