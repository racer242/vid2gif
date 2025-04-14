import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import createError from "http-errors";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import cors from "cors";

import indexRouter from "./routes/indexRouter.js";

import logRouter from "./routes/logRouter.js";
import statsRouter from "./routes/statsRouter.js";
import taskRouter from "./routes/taskRouter.js";

import dictionary from "./configuration/dictionary.js";
import settings from "./configuration/settings.js";
import ApiApp from "./ApiApp.js";
import resourceRouter from "./routes/resourceRouter.js";

// Приложение на базе Express
const app = express();
app.use(cors());

// Удалить заголовок в целях безопасности
app.disable("x-powered-by");

// TODO: Использовать защиту (npm install --save helmet) https://expressjs.com/ru/advanced/best-practice-security.html

// Подключаются модули Express для обработки запроса
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false })); // модуль, для парсинга JSON в запросах
app.use(bodyParser.json()); // модуль, для парсинга JSON в запросах
app.use(methodOverride()); // поддержка put и delete

app.use(express.static(path.join(__dirname, "../public")));

// Разводим по роутерам

app.use("/api/log/", logRouter);
app.use("/api/stats/", statsRouter);
app.use(taskRouter);
app.use(taskRouter);
app.use(resourceRouter);

// Роутер, обрабатывающий индекс
app.use("/", indexRouter);

// Обработчик необработанного запроса - генерирует ошибку 404
app.use(function (req, res, next) {
  res.status(404);
  res.send(dictionary.responces.error404);
});

// Обработчик внутренних ошибок
app.use(function (err, req, res, next) {
  switch (err) {
    default: {
      if (err.status === 404) {
        if (req.url.match(settings.search.findHtmlFile())) {
          res.send(settings.html.page404);
        } else {
          res.send(dictionary.responces.error404Internal);
        }
      } else {
        console.log(err);
        res.status(err.status || 500);
        res.send({
          ...dictionary.responces.error,
          title: err.status || 500,
          error: req.app.get("env") === "development" ? err : {},
        });
      }
    }
  }
});

// Инициализация состояния мониторинга
// Состоянием является объект, в который передаются данные для мониторинга
// Состояние модифицируется приложением и при любом запросе выдается актуальная
// информация
var appState = {};

app.set("appState", appState);

// Создание API Manager и его запуск
const apiApp = new ApiApp(appState);
apiApp.init();
apiApp.start();

// Обработка корректного закрытия приложения после ошибок и прочих причин
process.stdin.resume();
process.on("exit", () => {
  apiApp.destroy();
});
process.on("SIGINT", () => {
  apiApp.destroy();
});
process.on("SIGUSR1", () => {
  apiApp.destroy();
});
process.on("SIGUSR2", () => {
  apiApp.destroy();
});
// process.on('uncaughtException', ()=>{converter.destroy();});

app.registerStats = (stats) => {
  apiApp.registerRequestStats(stats);
};

export default app;
