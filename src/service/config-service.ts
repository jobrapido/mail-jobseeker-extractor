import { injectable } from "tsyringe";

@injectable()
export class ConfigService {

  public readonly dbPassword: string = process.env.DB_PASSWORD || "unknown";
  public readonly dbHost: string = process.env.DB_HOST || "unknown";
  public readonly datastoreUrl: string = process.env.DATASTORE_API_URL || "unknown";
  public readonly timezoneServiceApiUrl: string = process.env.TIMEZONE_SERVICE_API_URL || "unknown";

}
