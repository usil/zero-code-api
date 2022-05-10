import compression from 'compression';
import express, { Application } from 'express';
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
        this.configuration.jwtSecret,
        this.configuration.cryptoKey,
        parsedTables,
        'zero_code_api',
        '::usil.zc.app',
      );

      this.app = oauthBoot.expressSecured;

      this.addBasicConfiguration();

      oauthBoot.setTokenExpirationTime('12h');

      await oauthBoot.init();

      await this.exposeDataBase(oauthBoot);
    } catch (error) {
      throw new Error('An error ocurred while creating the server');
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

  async exposeDataBase(oauthBoot: any) {
    const conversion = new Conversion(this.knexPool, oauthBoot);
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
  }

  /**
   *
   * @description A function to add the routes
   */
  addRoutes(fullRoute: Route): void {
    this.routes.push(fullRoute.route);
    this.app.use(fullRoute.route, fullRoute.router);
  }

  /**
   * @description Creates the server
   */
  createServer(): http.Server {
    this.server = http.createServer(this.app);
    this.server.listen(this.port);
    return this.server;
  }
}

export default ServerInitialization;
