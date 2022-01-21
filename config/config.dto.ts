import bunyan from 'bunyan';

/**
 * @description The parameters that all environments should have
 */
export class ConfigGlobalDto {
  state: string;
  port: number;
  dataBaseName: string;
  log: () => bunyan;
  dataBaseHost: string;
  dataBasePort: number;
  dataBaseUser: string;
  dataBasePassword: string;
  jwtSecret: string;
  swaggerEmail: string;
  swaggerName: string;
  swaggerUrl: string;
  occultSystemTables: boolean;
}

export default new ConfigGlobalDto();
