import dictionary from "../configuration/dictionary";
import AbstractManager from "../abstracts/AbstractManager";
import { log } from "../services/Logger";
import TaskManager from "./TaskManager";

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
    this.lastTime = 0;
    this.managers = [];
    this.manager_completeHandler = this.manager_completeHandler.bind(this);
  }

  update(data) {
    if (this.data.queueCheckInterval <= Date.now() - this.lastTime) {
      this.lastTime = Date.now();
      this.processQueue(data);
    }
    this.callFinishCallback();
  }

  manager_completeHandler(manager) {
    log(this, dictionary.log.taskCompletes, manager.task.id);
    this.managers = this.managers.filter((v) => v !== manager);
    manager.destroy();
  }

  processQueue(data) {
    if (data?.queue) {
      let findTask = data.queue.filter((v) => v.status === "wait");
      if (findTask.length > 0) {
        if (this.managers.length >= this.data.maxThreads) {
          log(this, dictionary.log.tooManyTasksError);
        } else {
          let task = findTask[0];
          log(this, dictionary.log.taskAdded, task.id);
          let manager = new TaskManager(
            "task",
            this.data,
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
