import { Request, Response } from 'express';
import { Knex } from 'knex';
import tableSettings from '../../tableSettings';

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

  getAll = (tableName: string) => {
    return async (req: Request, res: Response) => {
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
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
      }
    };
  };

  create = (tableName: string) => {
    return async (req: Request, res: Response) => {
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
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
      }
    };
  };

  updateOneById = (tableName: string) => {
    return async (req: Request, res: Response) => {
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
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
      }
    };
  };

  getOneById = (tableName: string) => {
    return async (req: Request, res: Response) => {
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
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
      }
    };
  };

  deleteOneById = (tableName: string) => {
    return async (req: Request, res: Response) => {
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
          return res.status(501).json({
            message: 'Could not delete from the data base',
            code: 500001,
          });
        }

        return res.status(201).json({
          content: req.params.id,
          message: 'success',
          code: 200001,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
      }
    };
  };

  query = (tableName: string) => {
    return async (req: Request, res: Response) => {
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

        let columnsToSelect = [] as string[];

        const columnsToSelectBySettings = tableSettings[tableName] || [];
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
          const result = await paginationQuery;
          return res.status(200).json({
            content: {
              items: result,
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
        console.error(error);
        return res.status(500).json({ message: error.message, code: 500000 });
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
