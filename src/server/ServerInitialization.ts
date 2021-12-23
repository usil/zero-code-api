import compression from 'compression';
import express from 'express';
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

/**
 *
 * @description Use this class to create and serve an application
 */
class ServerInitialization
  implements IExpressNecessaryFunctions, IExpressNecessaryParams
{
  app: express.Application;
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
    this.app = express();
    this.port = port;
    this.addBasicConfiguration();
    this.exposeDataBase();
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

  exposeDataBase() {
    const conversion = new Conversion(this.knexPool);
    conversion.generateConversionRouter();
    this.addRoutes(conversion.conversionRouter);
    // const tables = (await this.knexPool.schema.raw(
    //   `SELECT table_name, table_comment, table_schema
    //   FROM information_schema.tables WHERE table_schema = '${this.configuration.dataBaseName}'`,
    // )) as any as any[];
    // console.log(tables[0]);
    // const columns: Record<string, any> = {};
    // for (const table of tables[0]) {
    //   // const tableColumnsInfo = await this.knexPool.raw(
    //   //   `SELECT column_name, column_default, is_nullable, data_type, column_type, extra, column_comment, column_key FROM information_schema.COLUMNS
    //   //   WHERE table_schema = '${this.configuration.dataBaseName}' AND table_name = '${table.table_name}'`,
    //   // );
    //   // const tableColumnsRelationsInfo = await this.knexPool.raw(
    //   //   `SELECT
    //   //   table_schema,
    //   //   table_name,
    //   //   column_name,
    //   //   referenced_table_schema,
    //   //   referenced_table_name,
    //   //   referenced_column_name
    //   // FROM
    //   //   information_schema.key_column_usage
    //   // WHERE
    //   //   table_schema = '${this.configuration.dataBaseName}'
    //   //   AND referenced_table_name IS NOT NULL
    //   //   AND table_name = '${table.table_name}'`,
    //   // );
    //   // for (const column of tableColumnsRelationsInfo[0]) {
    //   //   const index = tableColumnsInfo[0].findIndex(
    //   //     (c: any) => c.column_name === column.column_name,
    //   //   );
    //   //   tableColumnsInfo[0][index] = {
    //   //     ...tableColumnsInfo[0][index],
    //   //     ...column,
    //   //   };
    //   // }
    //   // columns[table.table_name] = tableColumnsInfo[0];
    //   const route = new Route(table.table_name);
    //   route.router.get('/', async (req, res) => {
    //     const result = await this.knexPool.select().from(table.table_name);
    //     res.json({ result });
    //   });
    //   route.router.get('/:id', async (req, res) => {
    //     const result = await this.knexPool
    //       .select()
    //       .from(table.table_name)
    //       .where({ id: req.params.id });
    //     res.json({ result });
    //   });
    //   route.router.post('/', async (req, res) => {
    //     const result = await this.knexPool
    //       .table(table.table_name)
    //       .insert([...req.body.inserts]);
    //     res.json({ result });
    //   });
    //   this.addRoutes(route);
    // }
    // console.log('columns', columns);
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
