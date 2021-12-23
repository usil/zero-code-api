import { Request, Response } from 'express';
import { Knex } from 'knex';

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

  getAll = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.table_name;
      const result = await this.knex.table(tableName).select();
      return res.json({ result, message: 'success', code: 200000 });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.table_name;
      const result = await this.knex
        .table(tableName)
        .insert([...req.body.inserts]);
      return res.status(201).json({ result, message: 'success', code: 200001 });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  updateOneById = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.table_name;
      const result = await this.knex
        .table(tableName)
        .where({ id: req.params.id })
        .update(req.body, ['id']);
      return res.json({ result: result[0], message: 'success', code: 200001 });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  getOneById = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.table_name;
      const result = await this.knex
        .table(tableName)
        .where({ id: req.params.id })
        .select();
      return res.json({ result: result[0], message: 'success', code: 200000 });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  deleteOneById = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.table_name;

      const result = await this.knex
        .table(tableName)
        .where({ id: req.params.id })
        .del();

      if (result !== 1) {
        return res.status(501).json({
          message: 'Could not delete from the data base',
          code: 500001,
        });
      }

      return res.json({
        result: req.params.id,
        message: 'success',
        code: 200001,
      });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  query = async (req: Request, res: Response) => {
    try {
      let pagination = true;
      let itemsPerPage = 5;
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
      const tableName = req.params.table_name;
      const baseQuery = this.knex
        .table(tableName)
        .select(...(parsedBody.fields || []));
      const query = this.createFilter(parsedBody.filters, baseQuery);

      if (pagination) {
        const countBaseQuery = this.knex
          .table(tableName)
          .select(...(parsedBody.fields || []));
        const countQuery = this.createFilter(
          parsedBody.filters,
          countBaseQuery,
        ).count();
        const offset = itemsPerPage * pageIndex;
        const paginationQuery = query.limit(itemsPerPage).offset(offset);
        const count = (await countQuery)[0]['count(*)'];
        const totalPages = Math.ceil(count / itemsPerPage);
        const result = await paginationQuery;
        return res.status(201).json({
          result: {
            items: result,
            pageIndex,
            itemsPerPage,
            totalItems: count,
            totalPages,
          },
          message: 'success',
          code: 200001,
        });
      }
      const result = await query;
      return res.status(201).json({ result, message: 'success', code: 200001 });
    } catch (error) {
      console.error(error);
      return res.json({ message: error.message, code: 500000 });
    }
  };

  private createFilter = (filters: Filter[], queryBase: Knex.QueryBuilder) => {
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
        case '<':
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
