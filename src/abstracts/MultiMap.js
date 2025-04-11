import { getFilePath, getFileExt } from "../helpers/stringTools";
import dictionary from "../configuration/dictionary";
import { registerLog, log } from "../services/Logger";

import JsonMap from "./JsonMap";

class MultiMap {
  /**
   * Конструктор
   * Получает идентификатор, данные, колбек изменения, настройки
   */
  constructor(id, data, changedCallback, options) {
    this.id = id;
    this.extId = data.name;
    this.path = null;
    this.data = data;
    this.loaded = false;
    this.changedCallback = changedCallback;
    if (!options) {
      options = {};
    }
    // По умолчанию создаются двавида парсинга - xlsx и json
    if (!options.parsing) {
      options.parsing = {
        json: {
          factory: JsonMap,
        },
      };
    }

    this.parsing = options.parsing;
    this.map = null;

    registerLog(this);
  }

  /**
   * Инициализируем компоненты
   */
  init() {
    return true;
  }

  /**
   * Удаляем компоненты
   */
  destroy() {
    if (this.map) {
      this.map.destroy();
    }
    this.parsing = null;
    this.map = null;
    this.data = null;
    this.loaded = false;
    this.changedCallback = null;
  }

  /**
   * Запуск работы
   */
  start() {}

  /**
   * Возвращает новый путь карты
   * Используется потомками
   */
  newPath() {
    return "";
  }

  /**
   * Действия при изменении пути
   * Используется потомками
   */
  onNewPath() {}

  createMap(ext) {
    let mapFactory = this.parsing[ext].factory;
    this.map = new mapFactory(
      this.id,
      this.data,
      this.changedCallback,
      this.parsing[ext]
    );
    this.map.extId = this.extId;
    this.map.init(this.path);
    this.map.start();
  }

  /**
   * Итерация обновления. Проверка пути или файла
   */
  update(data) {
    // Получаем путь
    let newPath = this.newPath(data);

    // Если путь изменился
    if (this.path !== newPath) {
      this.path = newPath;
      if (this.path != null) {
        let ext = getFileExt(this.path.toLowerCase());
        if (this.map) {
          this.map.destroy();
        }
        this.createMap(ext);
      } else {
        this.map = null;
        return;
      }
      log(this, dictionary.log.mapPathChanged, this.path);
      this.onNewPath();
    }
    // Итерация обновления трекера изменений файла
    if (this.map) {
      this.map.update();
    }
  }
}

export default MultiMap;
