/**
 * Головной менеджер управления менеджерами процессов
 */

import AbstractManager from "../abstracts/AbstractManager";

class RootManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
  }
}

export default RootManager;
