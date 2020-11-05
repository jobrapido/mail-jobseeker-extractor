import "reflect-metadata";
import { injectable } from "tsyringe";
import { logger } from "../logger";
import { PostgresProvider } from "../provider/pg-provider";

export interface IQueryResult<T> {
  rowCount: number;
  rows: T[];
}

@injectable()
export class PostgresService {

  constructor(private postgresProvider: PostgresProvider) { }

  public async execute<T>(country: string, sql: string): Promise<IQueryResult<T>> {
    const pool = this.postgresProvider.provide(country);
    const client = await pool.connect();
    try {
      const res = await client.query(sql);
      logger.debug(`SQL executed and connection closed [result=${JSON.stringify(res)} sql=${sql}]`);
      return res;
    } catch (error) {
      error.message = `Exception during postgres operations. ${error.message}`;
      throw error;
    } finally {
      await client.release();
      await pool.end();
    }
  }
}
