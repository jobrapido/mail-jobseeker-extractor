import "reflect-metadata";
import { injectable } from "tsyringe";
import { HttpCodes } from "typed-rest-client/HttpClient";
import { logger } from "../logger";
import { RestClientProvider } from "../provider/rest-client-provider";
import { ConfigService } from "./config-service";

export interface ITimezonesResponse {
  readonly country: string;
  readonly timezone: string;
}

@injectable()
export class TimezoneService {

  private readonly timezones: ITimezonesResponse[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly restClientProvider: RestClientProvider) { }

  public async getTimezone(country: string) {
    try {
      if (this.timezones.length < 1) {
        this.timezones.push(...await this.fetchTimezones());
      }
      const timezonesResponse = this.timezones.find((item) => item.country === country.toLowerCase());

      if (!timezonesResponse) {
        throw new Error(`Country not found [country=${country}]`);
      }
      logger.debug(`Timezone service call succeed [country=${country} timezone=${timezonesResponse.timezone}]`);
      return timezonesResponse.timezone;
    } catch (error) {
      error.message = `Timezone service call failed [country=${country} url=${this.configService.timezoneServiceApiUrl} statusCode=${error.statusCode}]. ${error.message}`;
      throw error;
    }
  }

  public async fetchTimezones() {
    const response = await this.restClientProvider
      .provide()
      .get<ITimezonesResponse[]>(`${this.configService.timezoneServiceApiUrl}`);

    if (response.statusCode === HttpCodes.OK) {
      return response.result || [];
    }

    throw new Error("Invalid status code");
  }
}
