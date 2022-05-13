import { getConfig } from './../../config/main.config';
import ServerInitialization from './ServerInitialization';

/**
 * @description Creates the server
 */
export const newServer = async (port: number) => {
  const serverInit = new ServerInitialization(port);

  await serverInit.init();

  /**
   * * Creates the routes for the example.
   */

  const server = serverInit.createServer();

  return { server, app: serverInit.app };
};
