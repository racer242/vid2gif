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
  }

  update(data) {
    if (this.data.queueCheckInterval <= Date.now() - this.lastTime) {
      this.lastTime = Date.now();
      this.processQueue(data);
    }
  }

  processQueue(data) {
    if (data?.queue) {
      let findTask = data.queue.filter((v) => v.status === "wait");

      if (findTask.length > 0) {
        let task = findTask[0];
        let manager = new TaskManager("task", this.data);
        log(this, dictionary.log.taskAdded, task.id);
        manager.init();
        manager.start();
        manager.startTask(task);

        this.managers.push(manager);

        // manager.destroy();
        // manager.update(this.appState);
      }
    }
  }
}

export default QueueManager;
