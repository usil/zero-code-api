import ServerInitialization from './ServerInitialization';
import { createRouteExample } from './routes/exampleRoute';

/**
 * @description Creates the server
 */
export const newServer = async (port: number) => {
  const serverInit = new ServerInitialization(port);

  await serverInit.init();

  /**
   * * Creates the routes for the example.
   */

  const routesExample = createRouteExample();
  serverInit.addRoutes(routesExample);

  const server = serverInit.createServer();

  return { server, app: serverInit.app };
};
