import dictionary from "../configuration/dictionary";
import AbstractManager from "../abstracts/AbstractManager";
import { log } from "../services/Logger";
import TaskManager from "./TaskManager";
import { getFileNamesInFolder, readFile } from "../helpers/fileTools";
import settings from "../configuration/settings";
import path from "path";
import dirtyJson from "dirty-json";

/**
 * Queue Manager
 * Управляет очередью задач
 */
class QueueManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.extId = "queue";
    this.lastCheckTime = 0;
    this.lastClearTime = 0;
    this.managers = [];
    this.manager_completeHandler = this.manager_completeHandler.bind(this);
    this.startTasks = null;
  }

  start() {
    super.start();
    let fileDir = settings.outputLocation;
    let fileNames = getFileNamesInFolder(fileDir, /json/gi);
    if (fileNames?.length > 0) {
      this.startTasks = [];
      for (let i = 0; i < fileNames.length; i++) {
        let taskPath = path.join(fileDir, fileNames[i]);
        let task = readFile(taskPath);
        if (task) {
          this.startTasks.push(dirtyJson.parse(task));
        }
      }
    }
  }

  update(appState) {
    if (this.data.queueClearInterval <= Date.now() - this.lastClearTime) {
      this.lastClearTime = Date.now();
      if (appState.queue) {
        appState.queue = appState.queue.filter(
          (v) => v.status !== "ready" && v.status !== "error"
        );
      }
    }
    if (this.data.queueCheckInterval <= Date.now() - this.lastCheckTime) {
      this.lastCheckTime = Date.now();
      if (this.startTasks) {
        if (!appState.queue) {
          appState.queue = [];
        }
        appState.queue = appState.queue.concat(this.startTasks);
        log(
          this,
          dictionary.log.uncompletedTasksDetected,
          this.startTasks.length
        );
        this.startTasks = null;
      }
      this.processQueue(appState);
    }
    this.callFinishCallback();
  }

  manager_completeHandler(manager) {
    log(this, dictionary.log.taskCompletes, manager.task.id);
    this.managers = this.managers.filter((v) => v !== manager);
    manager.destroy();
  }

  processQueue(appState) {
    if (appState.queue) {
      let findTask = appState.queue.filter((v) => v.status === "wait");
      if (findTask.length > 0) {
        if (this.managers.length >= this.data.maxThreads) {
          log(this, dictionary.log.tooManyTasksError);
        } else {
          let task = findTask[0];
          log(this, dictionary.log.taskAdded, task.id);
          let manager = new TaskManager(
            settings.systemLogId,
            this.data,
            appState,
            this.manager_completeHandler
          );
          this.managers.push(manager);
          manager.init();
          manager.start();
          manager.startTask(task);
        }
      }
    }
  }

  destroy() {
    for (let manager of this.managers) {
      manager.destroy();
    }
    this.managers = [];
    super.destroy();
  }
}

export default QueueManager;
