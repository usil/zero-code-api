import { Knex } from 'knex';
import { getConfig } from '../../../config/main.config';
import Route from '../util/Route';
import ConversionHelpers from './ConversionHelpers';
import swaggerUI from 'swagger-ui-express';
import MysqlConversion from './MysqlConversion';
import { NextFunction, Request, Response } from 'express';
import SwaggerGenerator from './SwaggerGenerator';

interface Table {
  table_name: string;
  table_comment?: string;
  table_schema: string;
}

interface Column {
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

class Conversion {
  knex: Knex;
  knexConfig: Knex.Config;
  configuration = getConfig();
  conversionHelpers: ConversionHelpers;
  conversionRouter: Route;

  constructor(knex: Knex) {
    this.knex = knex;
    this.knexConfig = knex.client.config;
  }

  getConversionDataBase() {
    switch (this.knexConfig.client) {
      case 'mysql2':
        break;
      default:
        break;
    }
  }

  generateConversionRouter() {
    this.conversionHelpers = new ConversionHelpers(this.knex);
    this.conversionRouter = new Route('/api');
    this.setSwaggerEndPoint();
    this.setGetAll();
    this.setCreate();
    this.setQuery();
    this.setGetOneById();
    this.setDeleteOneById();
    this.setGetUpdateById();
  }

  setSwaggerEndPoint() {
    this.conversionRouter.router.use('/docs', swaggerUI.serve);
    this.conversionRouter.router.get(
      '/docs',
      async (req: Request, res: Response, next: NextFunction) => {
        let tableColumns: Record<string, Column[]>;
        let tables: Table[];
        switch (this.knexConfig.client) {
          case 'mysql2':
            const mysqlConversion = MysqlConversion(
              this.knex,
              this.configuration,
            );
            await mysqlConversion.getAllTablesColumns();
            tableColumns = mysqlConversion.tablesColumns;
            tables = mysqlConversion.tables;
            break;
          default:
            break;
        }
        const swaggerGenerator = new SwaggerGenerator(
          {
            contact: {
              email: 'luis.huertas@metricaandina.com',
              name: 'USIL',
              url: 'https://github.com/usil/zero-code-api',
            },
            title: `Zero Code REST API for ${this.configuration.dataBaseName}`,
            version: '1.0.0',
            description: `REST endpoints for ${this.configuration.dataBaseName}, that were auto-generated`,
          },
          tableColumns,
          tables,
          req.protocol + '://' + req.get('host'),
        );
        const swaggerDoc = swaggerGenerator.generateJSON();
        (req as any).swaggerDoc = swaggerDoc;
        next();
      },
      swaggerUI.setup(),
    );
  }

  setGetOneById() {
    this.conversionRouter.router.get(
      '/:table_name/:id',
      this.conversionHelpers.getOneById,
    );
  }

  setGetUpdateById() {
    this.conversionRouter.router.put(
      '/:table_name/:id',
      this.conversionHelpers.updateOneById,
    );
  }

  setDeleteOneById() {
    this.conversionRouter.router.delete(
      '/:table_name/:id',
      this.conversionHelpers.deleteOneById,
    );
  }

  setGetAll() {
    this.conversionRouter.router.get(
      '/:table_name',
      this.conversionHelpers.getAll,
    );
  }

  setCreate() {
    this.conversionRouter.router.post(
      '/:table_name',
      this.conversionHelpers.create,
    );
  }

  setQuery() {
    this.conversionRouter.router.post(
      '/:table_name/query',
      this.conversionHelpers.query,
    );
  }
}

export default Conversion;
