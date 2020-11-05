import * as moment from "moment";
import { Moment } from "moment";
import "reflect-metadata";
import { injectable } from "tsyringe";
import { fmt, logger } from "../logger";
import { RestClientProvider } from "../provider/rest-client-provider";
import { ConfigService } from "./config-service";
import { TimezoneService } from "./timezone-service";

const QUERIES_REGION = "mail.jobseeker.extractor.queries";
const CONFIGS_REGION = "mail.jobseeker.extractor.schedule";

export interface IMailJobseekerExtractorConfig {
  readonly sql: string;
  readonly start: Moment;
  readonly end: Moment;
  readonly interval: number;
  readonly time: string;
  readonly country: string;
  readonly timezone: string;
}

export interface IMailJobseekerExtractorRawConfig {
  readonly query: string;
  readonly start: string;
  readonly end: string;
  readonly interval: string;
  readonly time: string;
}

export interface IDatastoreKey {
  readonly region: string;
  readonly key: string;
}

export interface IDatastoreElementValue {
  readonly datastoreKey: IDatastoreKey;
  readonly value: string;
}

export interface IDatastoreValueListDTO {
  readonly list: IDatastoreElementValue[];
}

export interface IDatastoreEntry {
  readonly [key: string]: string | undefined;
}

export interface IQueryList {
  readonly [key: string]: string | undefined;
}

const ISO_DATE_FORMAT = "YYYY-MM-DD";

@injectable()
export class DatastoreService {

  constructor(
    private readonly configService: ConfigService,
    private readonly restClientProvider: RestClientProvider,
    private readonly timezoneService: TimezoneService,
  ) { }

  public async composeMailJobseekerExtractorConfig(country: string) {

    const rawConfig = await this.fetchMailJobseekerExtractorConfig(country);
    const timezone = await this.timezoneService.getTimezone(country);
    const sql = await this.resolveQueryKey(rawConfig.query);

    const config = {
      start: moment.tz(rawConfig.start, ISO_DATE_FORMAT, true, timezone),
      end: moment.tz(rawConfig.end, ISO_DATE_FORMAT, true, timezone),
      time: rawConfig.time,
      interval: Number(rawConfig.interval),
      country,
      timezone,
      sql,
    };

    if (!config.start.isValid() || !config.end.isValid()) {
      throw new Error("Invalid date format. Check Datastore configurations");
    }

    logger.debug(`Composed config [country=${country} map=${fmt(config)}]`);
    return config;
  }

  public async fetchQueries(): Promise<IQueryList> {
    logger.debug("Fetching available queries");

    try {
      const response = await this
        .restClientProvider
        .provide()
        .get<IDatastoreValueListDTO>(`${this.configService.datastoreUrl}/${QUERIES_REGION}`);

      const adsValue = response.result as IDatastoreValueListDTO;
      const queriesMap = adsValue.list.reduce((acc, item) => ({
        ...acc,
        [item.datastoreKey.key]: item.value,
      }), {});

      logger.debug(`Available queries fetched [map=${fmt(queriesMap)}`);
      return queriesMap;
    } catch (error) {
      error.message = `Error while fetching mail jobseeker extractor queries. ${error.message}`;
      throw error;
    }
  }

  public async resolveQueryKey(queryKey: string): Promise<string> {
    const queries = await this.fetchQueries();
    logger.debug(`Fetched queries [queries=${fmt(queries)}]`);

    const query = queries[queryKey];

    if (!query) {
      throw new Error(`Invalid query selected resolving query key [wanted=${queryKey} queries=${fmt(Object.keys(queries))}]`);
    }

    return query;
  }

  private async fetchMailJobseekerExtractorConfig(country: string) {
    logger.debug(`Fetching MailJobseekerExtractor config [country=${country}]`);
    const url = `${this.configService.datastoreUrl}/${CONFIGS_REGION}.${country.toLowerCase()}`;
    try {
      const response = await this
        .restClientProvider
        .provide()
        .get<IDatastoreValueListDTO>(`${url}`);

      const rawConfig = response.result!.list.reduce((acc, item) => ({
        ...acc,
        [item.datastoreKey.key]: item.value,
      }), {}) as IMailJobseekerExtractorRawConfig;

      logger.debug(`Fetched config [country=${country} map=${fmt(rawConfig)}]`);
      return rawConfig;
    } catch (error) {
      error.message = `Error while fetching MailJobseekerExtractor schedule configs [country=${country} url=${url}]. ${error.message}`;
      throw error;
    }
  }
}
