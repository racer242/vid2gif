import express from "express";
import path from "path";
import settings from "../configuration/settings.js";
import { readFile } from "../helpers/fileTools.js";
import dictionary from "../configuration/dictionary.js";

// Создаем роутер
const logRouter = express.Router();

// Определяем обработчик любого URL
logRouter.get("/*", function (req, res, next) {
  // if (req.headers.token != settings.secretTokens.resource) {
  //   console.log("Authorization failed:", reqPath);
  //   res.status(403);
  //   res.end();
  //   return;
  // }

  let logFilePath = settings.systemLogLocation;
  let logFileName = settings.logFileName.replace(
    new RegExp(dictionary.replace.id.source, dictionary.replace.id.flags),
    settings.builderId
  );
  let filePath = path.join(logFilePath, logFileName);

  let content = readFile(filePath);
  if (content) {
    content = content.toString().replace(/\r\n/g, "\n").split("\n");
    content = content.reverse();
    let isLast = false;
    res.send({
      log: content,
      isLast,
    });
  } else {
    res.send([]);
  }
});

export default logRouter;
