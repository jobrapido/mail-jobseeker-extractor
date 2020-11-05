import * as program from "commander";
import "reflect-metadata";
import { container } from "tsyringe";
import { Application } from "./app";
import { logger } from "./logger";
import { QueryExecutor } from "./service/query-executor";

program
  .command("run")
  .description("Run the query configured for the specified country")
  .option("-c, --country <required>", "The country to execute the jobseeker mail extractor")
  .action(async (command) => {
    if (!command.country) {
      program.outputHelp();
      process.exit(1);
    }
    const country = command.country.toLowerCase();
    logger.info(`Executing "run" command [country=${country}]`);
    const executor = container.resolve(QueryExecutor);
    try {
      const result = await executor.insert(country);
      logger.info(`Inserted ${result} rows`);
      process.exit(0);
    } catch (error) {
      logger.error(`Error while executing run command.`, error.stack);
      process.exit(1);
    }
  });

program
  .command("serve")
  .description("Serve rest interface via http")
  .action(() => {
    const port = 8000;
    logger.info(`Executing "serve" command [port=${port}]`);
    const app = container.resolve(Application);
    app.start(port);
  });

program
  .version("1.0.0", "-v, --version")
  .parse(process.argv);
