import "reflect-metadata";
import { injectable } from "tsyringe";
import { logger } from "../logger";
import { IMailJobseekerExtractorConfig } from "./datastore-service";
import { ICountryState } from "./query-executor";

@injectable()
export class QueryComposer {

  public composeCountryStateGet(country: string) {
    logger.debug(`Composing country run state get query [country=${country}]`);
    const query = `SELECT country, lastrun, running FROM country_state WHERE country = '${country}'`;

    logger.debug(`Composed country run state get query [sql=${query}]`);
    return query;
  }

  public composeCountryStateUpdate(state: ICountryState) {
    logger.debug(`Composing country run state update query [country=${state.country}]`);
    const query = `UPDATE country_state SET lastrun = '${state.lastrun}', running = ${state.running} WHERE country = '${state.country}'`;

    logger.debug(`Composed country run state update query [sql=${query}]`);
    return query;

  }

  public composeInsert(config: IMailJobseekerExtractorConfig) {
    logger.debug(`Composing insert query [country=${config.country}]`);
    const query = `INSERT INTO jobseeker_mail_target( SELECT id FROM jobseeker WHERE ${config.sql} )`;

    logger.debug(`Composed insert query [sql=${query}]`);
    return query;
  }
}
