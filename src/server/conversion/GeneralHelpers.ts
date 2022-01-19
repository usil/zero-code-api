import { ConfigGlobalDto } from '../../../config/config.dto';
import { Request, Response } from 'express';
import { Knex } from 'knex';
import MysqlConversion from './MysqlConversion';

class GeneralHelpers {
  knex: Knex;
  configuration: Partial<ConfigGlobalDto>;

  constructor(knex: Knex, configuration: Partial<ConfigGlobalDto>) {
    this.knex = knex;
    this.configuration = configuration;
  }

  getAllTables = async (req: Request, res: Response) => {
    try {
      const mysqlConversion = MysqlConversion(this.knex, this.configuration);
      const [tables, error] = await mysqlConversion.getTables();
      if (error) {
        return res.status(500).json({ message: error, code: 500000 });
      }
      return res
        .status(200)
        .json({ message: 'Tables selected', code: 200000, content: tables });
    } catch (error) {
      return res.status(500).json({ message: error.message, code: 500000 });
    }
  };

  getFullTable = async (req: Request, res: Response) => {
    try {
      const tableName = req.params.tableName;
      const mysqlConversion = MysqlConversion(this.knex, this.configuration);
      const [fullTable, error] = await mysqlConversion.getFullTable(tableName);
      if (error) {
        return res.status(500).json({ message: error, code: 500000 });
      }
      return res
        .status(200)
        .json({ message: 'Tables selected', code: 200000, content: fullTable });
    } catch (error) {
      return res.status(500).json({ message: error.message, code: 500000 });
    }
  };
}

export default GeneralHelpers;
