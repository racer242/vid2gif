import appRoot from "app-root-path";

import settings from "./configuration/settings";
import dictionary from "./configuration/dictionary";

import { initLogger, registerLog, log } from "./services/Logger";

import { createConfiguration } from "./configuration/Configuration";
import RootManager from "./managers/RootManager";
import TaskManager from "./managers/TaskManager";
import path from "path";
import StatsManager from "./managers/StatsManager";

/**
 * API Manager
 */
class AdverterBuilderManager {
  /**
   * Конструктор
   */
  constructor(output) {
    this.rootManager_cycleFinishedHandler =
      this.rootManager_cycleFinishedHandler.bind(this);
    this.map_changedHandler = this.map_changedHandler.bind(this);
    this.cycle = this.cycle.bind(this);

    this.output = output;

    this.totalCounter = 0;
    this.stepCounter = 0;
    this.cycleCounter = 0;
    this.data = {};

    this.id = settings.systemLogId;
    let logFileName = settings.logFileName.replace(
      new RegExp(dictionary.replace.id.source, dictionary.replace.id.flags),
      settings.builderId
    );
    let logFilePath = path.join(appRoot.path, settings.systemLogPath);

    this.consoleBuffer = [];

    initLogger({
      logFileName: logFileName,
      appName: settings.builderId,
      logsFolderName: settings.logsFolderName,
      clearLogs: false,
      errorLogId: settings.errorLogId,
      systemLogId: settings.systemLogId,
      useConsole: true,
      logMessageDictionary: dictionary.logMessages,
      undefinedLogError: dictionary.log.undefinedLogError,
      logSaveError: dictionary.log.logSaveError,
      undefinedErrorLog: dictionary.log.undefinedErrorLog,
      systemLogSaveError: dictionary.log.systemLogSaveError,
      loopedMessageDetected: dictionary.log.loopedMessageDetected,
      consoleOutputLevels: settings.consoleOutputLevels,
      maxFileSize: settings.maxLogSize,
      logArchiveLocation: settings.logArchiveLocation,
      logArchiveFileName: settings.logArchiveName,
      archivedLogMessage: dictionary.log.archivedLogMessage,
      consoleBuffer: this.consoleBuffer,
      consoleBufferMaxLines: 40,
    });
    registerLog(this, { path: logFilePath });

    // Создание конфигураций
    this.configuration = createConfiguration(
      settings.systemLogId,
      this.data,
      this.map_changedHandler
    );

    // Создание менеджеров
    this.rootManager = new RootManager(
      "root",
      this.data,
      this.rootManager_cycleFinishedHandler
    );
    this.taskManager = new TaskManager("task", this.data);
    this.statsManager = new StatsManager("stats", this.data);
  }

  /**
   * Инициализация сервисов, конфигураций, менеджеров
   */
  init() {
    this.configuration.init();
    this.rootManager.init();
    this.taskManager.init();
    this.statsManager.init();
  }

  /**
   * Запуск сервисов, конфигураций, менеджеров
   */
  start() {
    this.configuration.start();
    this.rootManager.start();
    this.taskManager.start();
    this.statsManager.start();
    log(this, dictionary.log.converterStartMessage);

    // Запуск цикла индексации
    this.cycle();
  }

  /**
   * Удаление сервисов, конфигураций, менеджеров
   */
  destroy() {
    this.configuration.destroy();
    this.rootManager.destroy();
    this.taskManager.destroy();
    this.statsManager.destroy();
    clearTimeout(this.cycleTimeout);
  }

  /**
   * Цикл мониторинга пространства Adverter
   */
  cycle() {
    this.iteration();

    this.cycleTimeout = setTimeout(
      this.cycle,
      this.configuration.data.updateInterval
    );
  }

  registerRequestStats(stats) {
    this.statsManager.registerRequestStats(stats);
  }

  /**
   * Одна итерация цикла мониторинга пространства
   */
  iteration() {
    this.totalCounter++;
    this.stepCounter++;

    // Вывод активности в консоль
    process.stdout.cursorTo(0);
    process.stdout.clearLine();
    process.stdout.write(
      "\x1b[32m" +
        " Cycle:" +
        "\x1b[0m" +
        this.cycleCounter +
        "\x1b[32m" +
        " Step:" +
        "\x1b[0m" +
        this.stepCounter +
        " " +
        "\x1b[32m" +
        dictionary.animation[
          (this.cycleCounter + this.stepCounter) % dictionary.animation.length
        ] +
        "\x1b[0m"
    );
    process.stdout.cursorTo(0);

    // Мониторинг конфигураций
    this.configuration.update();
    this.rootManager.update(this.configuration.data);
    this.taskManager.update(this.output);
    this.statsManager.update(this.output);

    this.output.stepCounter = this.stepCounter;
    this.output.cycleCounter = this.cycleCounter;
    this.output.log = this.consoleBuffer;
  }

  /**
   * Обработчик окончания обхода всех менеджеров
   */
  rootManager_cycleFinishedHandler() {
    this.cycleCounter++;
    this.stepCounter = 0;
  }

  /**
   * Обработчик обновления корневых конфигураций
   * Обновление корневых конфигураций на столько значимо, что необходимо
   * пересоздать все менеджеры пространства Adverter (начиная с корневого)
   */
  map_changedHandler() {
    this.rootManager.destroy();
    this.rootManager = new RootManager(
      "root",
      this.data,
      this.rootManager_cycleFinishedHandler
    );
    this.rootManager.init();
    this.rootManager.start();
  }
}

export default AdverterBuilderManager;
