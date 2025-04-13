import path from "path";
import appRoot from "app-root-path";

require("dotenv").config();

const settings = {
  logFileName: "log.txt",
  logArchiveName: "log api {timestamp}.txt",
  errorLogId: "root",
  systemLogId: "system",
  logsFolderName: ".logs",

  maxLogSize: process.env.MAX_LOG_SIZE || 400,

  logArchiveLocation: process.env.LOG_ARCHIVE_LOCATION
    ? String(process.env.LOG_ARCHIVE_LOCATION)
    : null,

  systemLogLocation: process.env.SYSTEM_LOG_LOCATION
    ? String(process.env.SYSTEM_LOG_LOCATION)
    : path.join(appRoot.path, "/public"),

  outputLocation: process.env.OUTPUT_LOCATION
    ? String(process.env.OUTPUT_LOCATION)
    : path.join(appRoot.path, "/public/output"),

  tempLocation: process.env.TEMP_LOCATION
    ? String(process.env.TEMP_LOCATION)
    : path.join(appRoot.path, "/public/temp"),

  configurationPath: process.env.CONFIGURATION_PATH
    ? String(process.env.CONFIGURATION_PATH)
    : path.join(appRoot.path, "/public/configuration.json"),

  consoleOutputLevels: process.env.CONSOLE_LEVELS
    ? String(process.env.CONSOLE_LEVELS)
    : null,

  secretKey: process.env.SECRET_KEY ? String(process.env.SECRET_KEY) : null,

  callbackRetryCount: process.env.CALLBACK_RETRY_COUNT
    ? Number(process.env.CALLBACK_RETRY_COUNT)
    : 3,

  callbackRetryDuration: process.env.CALLBACK_RETRY_DURATION
    ? Number(process.env.CALLBACK_RETRY_DURATION)
    : 5000,

  builderId: "api",
  clearLogs: process.env.CLEAR_LOGS === "1",

  // https://passwordsgenerator.net/ (Exclude Ambiguous Characters checked, 256 length)
  secretTokens: {
    resource:
      "pdq_A3an?98wmEQ5%8vKdqwxK^Eh&Etrx$-cak9Mc9Ts%6Tg&b@2cnSnwUAUxurt6cq=pePgpwV7_XjFMuxeJ&rayy5AZHzXWm+R6Y@+XVv5bJMEFSM&#hqyLXpd2^g#cbN?PLzs+hs_N6&7WPP^vNLeZJEqgkT6JP_#N6GL^TZ73FjgFrKd=JE+MT?q=x-UR@4t6*X4rvHaW8EU*kny+Z?-#hv^Y=m@TJ&Xb37b5MNdKcdZv!Mwq%$&&r#Reun8",
    root: "b8jXNVwqNH72Z@k7#8L5gwk8wrDHv!ucm$AnV8YP%KyNKyRhxgSBA3FUepMKTkSvUnk$FrS3Vkt+3-CrJMy4w9_dJLe96t*J7XzHbA6ug7HJTN!mUgb#LYupnwBx4BxMGRDQG%+LAjJgYEg?W-bv?3$KZth*kBj7dx2^XKyee59XmnA#-R#Qs$!3RRB!z&&#z-Ly8r5m+4pG=B+5!QTaT+E&-942+#mw2gYSFSkm2Vw26F#W?Zf-PUEbCKF*f=nL",
    api: "JHjP-QFP-_8z&$=6*Y?N$Cq8vQWZg&GspSG&bCt^+&w4_79+Z8KcAqE^e4_HfkutSDPLxv+zGwr%7d#vbt=KLDug*+9ZTHAqN9Fytc78tt$tvtbUc^^%2pTbgYP##pD$AV+u-x8MvWj98zdtpntCUZKtD=kjFuCTMFs9$y+xLjCjVxaGy!a*r*uLWNjpF!7p^wGtCnCM8JB9XW!DWbU+4tfGLK#sumjWxsV2T_Y*^-E9qRh$zBwf8?$ksd#bjBv#",
  },
  zeroConfiguration: {
    updateInterval: 1000,
    maxHistoryLength: 400,
    statsCheckInterval: 5000,
    queueCheckInterval: 1000,
    previewOffset: 2,
    videoStart: 0,
    videoDuration: 7,
    videoSize: 420,
    videoFps: 24,
    maxThreads: 10,
  },
};
export default settings;
