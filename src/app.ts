import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as express from "express";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { logger } from "./logger";
import cors from "./util/cors";

@injectable()
export class Application {

  public readonly app: express.Application = express();

  constructor() {

    this.app.use(compression());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cors);
    this.app.set("etag", false);
    this.app.set("trust proxy", true);
    this.app.set("x-powered-by", false);

    this.app.get("/health", (_, response) => {
      response.contentType("text/plain");
      response.send("ok");
    });

    this.app.get("/api/v1/timezone/fullmap", async (_1, response, _2) => {
      response.json([{
        country: "xx",
        timezone: "America/Mexico_City",
      }, {
        country: "yy",
        timezone: "Europe/Rome",
      }, {
        country: "zz",
        timezone: "Pacific/Auckland",
      }]);
    });

    this.app.get("/api/v1/datastores/values/mail.jobseeker.extractor.schedule.xx", async (_1, response, _2) => {
      response.json({
        list: [
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.xx",
              key: "end",
            },
            value: "2018-05-30",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.xx",
              key: "interval",
            },
            value: "7",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.xx",
              key: "query",
            },
            value: "q1",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.xx",
              key: "start",
            },
            value: "2018-05-01",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.xx",
              key: "time",
            },
            value: "23:00",
          },
        ],
      });
    });

    this.app.get("/api/v1/datastores/values/mail.jobseeker.extractor.schedule.yy", async (_1, response, _2) => {
      response.json({
        list: [
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.yy",
              key: "end",
            },
            value: "2018-05-30",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.yy",
              key: "interval",
            },
            value: "7",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.yy",
              key: "query",
            },
            value: "q1",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.yy",
              key: "start",
            },
            value: "2018-05-01",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.yy",
              key: "time",
            },
            value: "23:00",
          },
        ],
      });
    });

    this.app.get("/api/v1/datastores/values/mail.jobseeker.extractor.schedule.zz", async (_1, response, _2) => {
      response.json({
        list: [
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.zz",
              key: "end",
            },
            value: "2020-12-31",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.zz",
              key: "interval",
            },
            value: "7",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.zz",
              key: "query",
            },
            value: "q1",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.zz",
              key: "start",
            },
            value: "2018-05-01",
          },
          {
            datastoreKey: {
              region: "mail.jobseeker.extractor.schedule.zz",
              key: "time",
            },
            value: "01:00",
          },
        ],
      });
    });

    this.app.get("/api/v1/datastores/values/mail.jobseeker.extractor.queries", async (_1, response, _2) => {
      response.json({
        list: [{
          datastoreKey: {
            region: "mail.jobseeker.extractor.queries",
            key: "q1",
          },
          value: "(age > 35 and date_trunc('day',lastvisit)>current_date-25)",
        }, {
          datastoreKey: {
            region: "mail.jobseeker.extractor.queries",
            key: "q2",
          },
          value: "(age > 20 and date_trunc('day',lastvisit)>current_date-40)",
        }],
      });
    });

    // tslint:disable-next-line:variable-name
    this.app.use((error: any, _request: Request, response: Response, _next: NextFunction) => {
      logger.error(error);
      response
        .status(500)
        .json({ message: error.message });
    });
  }

  public start(port: number) {
    this.app.listen(port, () => logger.info(`App started on port ${port}`));
  }
}
