/**
 * Менеджер управления кэшом
 *
 * Управляет списком менеджеров процессов сборщиков
 */

import AbstractManager from "../abstracts/AbstractManager";

class CacheManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.lastTime = 0;
  }

  update(data) {
    if (this.data.cacheCheckInterval <= Date.now() - this.lastTime) {
      console.log("CacheManager log");
    }
    this.callFinishCallback();
  }
}

export default CacheManager;
