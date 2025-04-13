/**
 * Головной менеджер управления менеджерами процессов
 */

import AbstractManager from "../abstracts/AbstractManager";
import QueueManager from "./QueueManager";
import StatsManager from "./StatsManager";

class RootManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
  }

  createChildren() {
    let statsManager = new StatsManager("stats", this.data, () => {
      this.childFinished(),
        () => {
          this.childCreated();
        };
    });
    this.statsManager = statsManager;
    statsManager.init();
    this.managers.push(statsManager);
    statsManager.start();

    let queueManager = new QueueManager("queue", this.data, () => {
      this.childFinished(),
        () => {
          this.childCreated();
        };
    });
    queueManager.init();
    this.managers.push(queueManager);
    queueManager.start();
  }

  registerRequestStats(stats) {
    this.statsManager?.registerRequestStats(stats);
  }

  destroyChildren() {
    super.destroyChildren();
    this.statsManager = null;
  }
}

export default RootManager;
