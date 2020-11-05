import { Pool } from "pg";
import { injectable } from "tsyringe";
import { ConfigService } from "../service/config-service";

@injectable()
export class PostgresProvider {

  constructor(private readonly configService: ConfigService) { }

  public provide = (country: string) => new Pool({
    host: `${this.configService.dbHost}`,
    database: `${country.toLowerCase()}_db`,
    user: `${country.toLowerCase()}_rw`,
    password: this.configService.dbPassword,
    connectionTimeoutMillis: 500,
  })
}
