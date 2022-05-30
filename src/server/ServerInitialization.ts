import compression from 'compression';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import http from 'http';
import Route from './util/Route';
import {
  IExpressNecessaryFunctions,
  IExpressNecessaryParams,
} from './util/ExpressNecessary';
import knex, { Knex } from 'knex';
import { getConfig } from '../../config/main.config';
import Conversion from './conversion/Conversions';
import OauthBoot from 'nodeboot-oauth2-starter';
import MysqlConversion from './conversion/MysqlConversion';
import { v4 as uuidv4 } from 'uuid';

/**
 *
 * @description Use this class to create and serve an application
 */
class ServerInitialization
  implements IExpressNecessaryFunctions, IExpressNecessaryParams
{
  app: any;
  baseExpressApp: Application;
  server: http.Server;
  port: number;
  routes: string[] = [];
  knexPool: Knex;
  configuration = getConfig();

  /**
   *Creates an instance of ExpressAPP.
   * @memberof ExpressAPP
   */
  constructor(port: number) {
    this.addKnexjsConfig();

    this.baseExpressApp = express();

    this.port = port;
  }

  async init() {
    try {
      const mysqlConversion = new MysqlConversion(
        this.knexPool,
        this.configuration,
      );

      const [tables, error] = await mysqlConversion.getTables();

      if (error) {
        throw new Error('An error ocurred while reading the database tables');
      }

      const parsedTables = tables.map((t) => t.table_name);

      const oauthBoot = new OauthBoot(
        this.baseExpressApp,
        this.knexPool,
        this.configuration.log(),
        {
          jwtSecret: this.configuration.jwtSecret,
          cryptoSecret: this.configuration.cryptoKey,
          extraResources: [...parsedTables, 'api'],
          mainApplicationName: 'zero_code_api',
          clientIdSuffix: '::usil.zc.app',
          expiresIn: this.configuration.jwtTokenExpiresIn,
        },
      );

      this.app = oauthBoot.expressSecured;

      this.addBasicConfiguration();

      await oauthBoot.init();

      await this.exposeDataBase(oauthBoot, this.knexPool);
    } catch (error) {
      this.configuration
        .log()
        .error(`An error ocurred while creating the server, ${error.message}`);
    }
  }

  /**
   * @description Adds the necessary knexjs configuration
   */
  addKnexjsConfig(): void {
    this.knexPool = knex({
      client: 'mysql2',
      version: '5.7',
      connection: {
        host: this.configuration.dataBaseHost,
        port: this.configuration.dataBasePort,
        user: this.configuration.dataBaseUser,
        password: this.configuration.dataBasePassword,
        database: this.configuration.dataBaseName,
      },
      pool: { min: 0, max: 5 },
    });
  }

  async exposeDataBase(oauthBoot: any, knexPool: Knex) {
    const conversion = new Conversion(knexPool, oauthBoot);
    await conversion.generateConversionRouter();
    this.addRoutes(conversion.conversionRouter);
  }

  /**
   * @description Adds the basic configuration for the app
   */
  addBasicConfiguration(): void {
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(morgan(':method :url'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.obGet('/', ':', this.healthEndpoint);
  }

  healthEndpoint(_req: Request, res: Response) {
    return res.status(200).send('Ok');
  }

  /**
   *
   * @description A function to add the routes
   */
  addRoutes(fullRoute: Route): void {
    this.routes.push(fullRoute.route);
    this.app.use(fullRoute.route, fullRoute.router);
  }

  errorHandle = (
    err: {
      message: string;
      statusCode?: number;
      errorCode?: number;
      onFunction?: string;
      onLibrary?: string;
      onFile?: string;
      logMessage?: string;
      originalError?: any;
    },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const uudid = uuidv4();
    this.configuration.log().error(
      uudid,
      '-',
      err.logMessage || err.message,
      {
        onFile: err.onFile,
        onFunction: err.onFunction,
        onLibrary: err.onLibrary,
      },
      err.originalError || undefined,
    );
    return res.status(err.statusCode || 500).json({
      message: err.message,
      code: err.errorCode || 500000,
      errorUUID: uudid,
    });
  };

  /**
   * @description Creates the server
   */
  createServer(): http.Server {
    this.server = http.createServer(this.app);
    this.server.listen(this.port);
    this.app.use(this.errorHandle);
    return this.server;
  }
}

export default ServerInitialization;
