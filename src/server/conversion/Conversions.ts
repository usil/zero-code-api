import { Knex } from 'knex';
import { getConfig } from '../../../config/main.config';
import Route from '../util/Route';
import ConversionHelpers from './ConversionHelpers';
import swaggerUI from 'swagger-ui-express';
import MysqlConversion from './MysqlConversion';
import { NextFunction, Request, Response } from 'express';
import SwaggerGenerator from './SwaggerGenerator';
import GeneralHelpers from './GeneralHelpers';
import ErrorForNext from '../util/ErrorForNext';

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
  oauthBoot: any;
  authRouter: any;
  knexConfig: Knex.Config;
  configuration = getConfig();
  conversionHelpers: ConversionHelpers;
  conversionRouter: Route;
  generalHelpers: GeneralHelpers;

  constructor(knex: Knex, oauthBoot: any) {
    this.oauthBoot = oauthBoot;
    this.knex = knex;
    this.knexConfig = knex.client.config;
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
      'Conversions.ts',
    ).setLogMessage(logMessage);

    if (error && error.response === undefined)
      errorForNext.setOriginalError(error);

    if (error && error.response) errorForNext.setErrorObject(error.response);

    if (error && error.sqlState)
      errorForNext.setMessage(`Data base error. ${message}`);

    return next(errorForNext.toJSON());
  };

  async generateConversionRouter() {
    try {
      this.conversionHelpers = new ConversionHelpers(this.knex);
      this.generalHelpers = new GeneralHelpers(this.knex, this.configuration);
      this.conversionRouter = new Route('/api');
      this.authRouter = this.oauthBoot.bootOauthExpressRouter(
        this.conversionRouter.router,
        '/api',
      );
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [tables, error] = await mysqlConversion.getTables();
      if (error) {
        throw new Error('An error ocurred while reading the database tables');
      }
      this.setSwaggerEndPoint();
      this.setGetTablesList();
      this.setGetFullTable();
      this.setRefreshEndpoint();
      this.setGetALLEndpoints(tables);
      this.setGetOneByIdEndpoints(tables);
      this.setGetUpdateByIdEndpoints(tables);
      this.setDeleteOneByIdEndpoints(tables);
      this.setCreateEndpoints(tables);
      this.setQueryEndpoints(tables);
      this.setRawDataBaseQueryEndPoint();
    } catch (error) {
      this.configuration.log().error(error.message);
      throw new Error(error.message);
    }
  }

  setRefreshEndpoint = () => {
    this.authRouter.obPost(
      `/zero-code/refresh`,
      `OAUTH2_global:*`,
      this.refreshEndpoints,
    );
  };

  setRawDataBaseQueryEndPoint = () => {
    this.authRouter.obPost(
      '/zero-code/raw-query',
      `OAUTH2_global:*`,
      this.conversionHelpers.rawQuery,
    );
  };

  refreshEndpoints = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const mysqlConversion = new MysqlConversion(
        this.knex,
        this.configuration,
      );
      const [tables, error] = await mysqlConversion.getTables();
      if (error) {
        throw new Error(
          `An error ocurred while reading the database tables; ${error}`,
        );
      }
      this.setGetALLEndpoints(tables);
      this.setGetOneByIdEndpoints(tables);
      this.setGetUpdateByIdEndpoints(tables);
      this.setDeleteOneByIdEndpoints(tables);
      this.setCreateEndpoints(tables);
      this.setQueryEndpoints(tables);
      this.setRawDataBaseQueryEndPoint();
      return res.json({ message: 'Endpoints refreshed', code: 200000 });
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500101,
        500,
        'refreshEndpoints',
        next,
        error,
      );
    }
  };

  setSwaggerMiddleware = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      let tableColumns: Record<string, Column[]>;
      let tables: Table[];

      switch (this.knexConfig.client) {
        case 'mysql2':
          const mysqlConversion = new MysqlConversion(
            this.knex,
            this.configuration,
          );
          const [result, error] = await mysqlConversion.getAllTablesColumns();
          if (error) {
            return this.returnError(
              error,
              error,
              500103,
              500,
              'setSwaggerMiddleware',
              next,
            );
          }
          tableColumns = result.tablesColumns;
          tables = result.tables;
          break;
        default:
          return this.returnError(
            'Unsupported data base',
            'Unsupported data base',
            400101,
            400,
            'setSwaggerMiddleware',
            next,
            error,
          );
      }

      const swaggerGenerator = new SwaggerGenerator(
        {
          contact: {
            email: this.configuration.swaggerEmail,
            name: this.configuration.swaggerName,
            url: this.configuration.swaggerUrl,
          },
          title: `Zero Code REST API for ${this.configuration.dataBaseName}`,
          version: '1.0.0',
          description: `REST endpoints for ${this.configuration.dataBaseName}, that were auto-generated`,
        },
        tableColumns,
        tables,
        req.get('host'),
      );
      const swaggerDoc = swaggerGenerator.generateJSON();
      (req as any).swaggerDoc = swaggerDoc;
      next();
    } catch (error) {
      return this.returnError(
        error.message,
        error.message,
        500102,
        500,
        'setSwaggerMiddleware',
        next,
        error,
      );
    }
  };

  setSwaggerEndPoint() {
    this.conversionRouter.router.use('/docs', swaggerUI.serve);
    this.conversionRouter.router.get(
      '/docs',
      this.setSwaggerMiddleware,
      swaggerUI.setup(),
    );
  }

  setGetALLEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obGet(
        `/${tableName}`,
        `${tableName}:select`,
        this.conversionHelpers.getAll(tableName),
      );
    }
  }

  setGetOneByIdEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obGet(
        `/${tableName}/:id`,
        `${tableName}:select`,
        this.conversionHelpers.getOneById(tableName),
      );
    }
  }

  setGetUpdateByIdEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obPut(
        `/${tableName}/:id`,
        `${tableName}:update`,
        this.conversionHelpers.updateOneById(tableName),
      );
    }
  }

  setDeleteOneByIdEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obDelete(
        `/${tableName}/:id`,
        `${tableName}:delete`,
        this.conversionHelpers.deleteOneById(tableName),
      );
    }
  }

  setCreateEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obPost(
        `/${tableName}`,
        `${tableName}:create`,
        this.conversionHelpers.create(tableName),
      );
    }
  }

  setQueryEndpoints(tablesList: Table[]) {
    for (const table of tablesList) {
      const tableName = table.table_name;
      this.authRouter.obPost(
        `/${tableName}/query`,
        `${tableName}:select`,
        this.conversionHelpers.query(tableName),
      );
    }
  }

  setGetTablesList() {
    this.authRouter.obGet('/table', ':', this.generalHelpers.getAllTables);
  }

  setGetFullTable() {
    this.authRouter.obGet(
      '/table/:tableName',
      ':',
      this.generalHelpers.getFullTable,
    );
  }
}

export default Conversion;
