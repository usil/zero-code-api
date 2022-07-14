import log4js from 'log4js';

/**
 * @description The parameters that all environments should have
 */
export class ConfigGlobalDto {
  state: string;
  port: number;
  dataBaseName: string;
  log: () => log4js.Logger;
  dataBaseHost: string;
  dataBasePort: number;
  dataBaseUser: string;
  dataBasePassword: string;
  jwtSecret: string;
  jwtTokenExpiresIn: string;
  swaggerEmail: string;
  swaggerName: string;
  swaggerUrl: string;
  occultSystemTables: boolean;
  cryptoKey: string;
  customSecurity: {
    useCustomSecurity: false;
    checkPermissionEndpoint: string;
    token: string;
    appIdentifier: string;
  };
}

export default new ConfigGlobalDto();
