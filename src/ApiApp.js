import settings from "./configuration/settings";
import dictionary from "./configuration/dictionary";

import { initLogger, registerLog, log } from "./services/Logger";

import { createConfiguration } from "./configuration/Configuration";
import RootManager from "./managers/RootManager";
import { displayIteration } from "./helpers/outputTools";

/**
 * API Manager
 */
class ApiApp {
  /**
   * Конструктор
   */
  constructor(appState) {
    this.rootManager_cycleFinishedHandler =
      this.rootManager_cycleFinishedHandler.bind(this);
    this.map_changedHandler = this.map_changedHandler.bind(this);
    this.cycle = this.cycle.bind(this);

    this.appState = appState;

    this.totalCounter = 0;
    this.stepCounter = 0;
    this.cycleCounter = 0;
    this.data = {};

    this.id = settings.systemLogId;
    let logFileName = settings.logFileName.replace(
      new RegExp(dictionary.replace.id.source, dictionary.replace.id.flags),
      settings.builderId
    );
    let logFilePath = settings.systemLogLocation;

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
  }

  /**
   * Инициализация сервисов, конфигураций, менеджеров
   */
  init() {
    this.configuration.init();
    this.rootManager.init();
  }

  /**
   * Запуск сервисов, конфигураций, менеджеров
   */
  start() {
    this.configuration.start();
    this.rootManager.start();
    log(this, dictionary.log.serviceStartMessage);

    // Запуск цикла индексации
    this.cycle();
  }

  /**
   * Удаление сервисов, конфигураций, менеджеров
   */
  destroy() {
    this.configuration.destroy();
    this.rootManager.destroy();
    clearTimeout(this.cycleTimeout);
  }

  /**
   * Цикл мониторинга пространства
   */
  cycle() {
    this.iteration();
    this.cycleTimeout = setTimeout(this.cycle, this.data.updateInterval);
  }

  registerRequestStats(stats) {
    this.rootManager.registerRequestStats(stats);
  }

  /**
   * Одна итерация цикла мониторинга пространства
   */
  iteration() {
    this.totalCounter++;
    this.stepCounter++;

    displayIteration(this.cycleCounter, this.stepCounter);

    this.configuration.update();
    this.rootManager.update(this.appState);

    this.appState.stepCounter = this.stepCounter;
    this.appState.cycleCounter = this.cycleCounter;
    this.appState.log = this.consoleBuffer;
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
   * пересоздать все менеджеры пространства (начиная с корневого)
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

export default ApiApp;
