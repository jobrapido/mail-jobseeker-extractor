import { Moment } from "moment";
import * as moment from "moment-timezone";
import "reflect-metadata";
import { injectable } from "tsyringe";
import { logger } from "../logger";
import { DatastoreService, IMailJobseekerExtractorConfig } from "./datastore-service";
import { PostgresService } from "./pg-service";
import { QueryComposer } from "./query-composer";

export interface ICountryState {
  country: string;
  lastrun: string;
  running: boolean;
}

@injectable()
export class QueryExecutor {

  constructor(
    private readonly postgresService: PostgresService,
    private readonly queryComposerService: QueryComposer,
    private readonly datastoreService: DatastoreService,
  ) { }

  public async insert(country: string) {
    const config = await this.datastoreService.composeMailJobseekerExtractorConfig(country);
    const currentState = await this.getCurrentRunningState(country);

    if (this.canRun(config, currentState)) {
      await this.lock(country, config.timezone);
      try {
        const sql = this.queryComposerService.composeInsert(config);
        const result = await this.postgresService.execute(country, sql);
        await this.unlock(country, config.timezone, moment.tz(config.timezone).format("YYYY-MM-DD"));
        return result.rowCount;
      } catch (error) {
        await this.unlock(country, config.timezone, currentState.lastrun);
        throw error;
      }
    }
    return 0;
  }

  private canRun(config: IMailJobseekerExtractorConfig, currentState: ICountryState) {
    const today = moment.tz(config.timezone);

    return !currentState.running
      && this.todayBetweenBoundaries(today, config.start, config.end)
      && this.configuredDaysIntervalElapsed(today, config.interval, moment.tz(currentState.lastrun, config.timezone))
      && this.configuredHourElapsed(today.format("HH:mm"), config.time);
  }

  private todayBetweenBoundaries(today: Moment, start: Moment, end: Moment) {
    logger.debug(`Computing if today is between configured boundaries [today=${today.format()} start=${start.format()} end=${end.format()}]`);
    return today.isBetween(start, end, "day", "[]");
  }

  private configuredDaysIntervalElapsed(today: Moment, interval: number, last: Moment) {
    const nextAvailableTick = last.clone().add(interval, "days");
    logger.debug(`Computing if interval has elapsed [today=${today.format()} interval=${interval} nextAvailableTick=${nextAvailableTick.format()}]`);
    return nextAvailableTick.isBefore(today);
  }

  private configuredHourElapsed(currentTime: string, configuredTime: string) {
    logger.debug(`Computing if time has elapsed [currentTime=${currentTime} configuredTime=${configuredTime}]`);
    return moment(currentTime, "HH:mm").isSameOrAfter(moment(configuredTime, "HH:mm"));
  }

  private async getCurrentRunningState(country: string) {
    logger.debug(`Get current running state [country=${country}]`);
    const sql = this.queryComposerService.composeCountryStateGet(country);
    const result = await this.postgresService.execute<ICountryState>(country, sql);
    return result.rows[0];
  }

  private async lock(country: string, timezone: string) {
    logger.debug(`Locking [country=${country}, timezone=${timezone}]`);
    const status = {
        country,
        lastrun: moment.tz(timezone).format("YYYY-MM-DD"),
        running: true,
    };
    const sql = this.queryComposerService.composeCountryStateUpdate(status);
    return await this.postgresService.execute(country, sql);
  }

  private async unlock(country: string, timezone: string, date: string) {
    logger.debug(`Unlocking [country=${country}, timezone=${timezone}]`);
    const status = {
      country,
      lastrun: date,
      running: false,
    };
    const sql = this.queryComposerService.composeCountryStateUpdate(status);
    return await this.postgresService.execute(country, sql);
  }
}
