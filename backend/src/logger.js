import pino from "pino";
import pretty from "pino-pretty";
import env from "./config/env.js";

const level = env.get("LOG_LEVEL") || (env.NODE_ENV === "production" ? "info" : "debug");

let logger;
if (env.NODE_ENV === "production") {
  logger = pino({ level });
} else {
  // pretty-print in development for readability
  logger = pino({ level }, pretty({ colorize: true, ignore: "pid,hostname" }));
}

const auditLogger = logger.child({ module: 'audit' });

export { auditLogger };
export default logger;
