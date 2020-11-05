import * as moment from "moment";
import { inspect } from "util";
import * as winston from "winston";
import {format} from "winston";

const MARATHON_APP_ID = process.env.MARATHON_APP_ID || "";
const MESOS_TASK_ID = process.env.MESOS_TASK_ID || "";

const LOG_LEVEL = process.env.LOG_LEVEL || "debug";
const isProductionMode = process.env.NODE_ENV === "production";

const kibanaFormatter = format.printf(({ level, message }) =>
  `${moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ")}|${level.toUpperCase()}|${MARATHON_APP_ID}|${MESOS_TASK_ID}||app|node.js||${message}`,
);

const developerFormatter = format.printf(({ level, message }) =>
  `${level}|${moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ")}|${message}`,
);

const productionFormat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
    kibanaFormatter,
  );

const developerFormat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
    format.colorize(),
    developerFormatter,
  );

export const logger = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      level: LOG_LEVEL,
    }),
  ],
  format: format.combine(
    isProductionMode ? productionFormat : developerFormat,
  ),
});

export const fmt = (obj: any) => inspect(obj, {
  colors: !isProductionMode,
  breakLength: Number.MAX_SAFE_INTEGER,
});
