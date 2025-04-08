/**
 * Карта конфигурации
 * Абстрактный класс для использования как основа карт
 * В зависимости от типа файла источника, создает нужную карту.
 * Карта загружает данные и отслеживает свли изменения.
 *
 * Регистрирует лог в директории своего размещения.
 *
 * Идентификация по двум параметрам (для лога):
 * id (передается в конструктор),
 * extId (имя из переданных данных)
 */

import pt from "path";

import settings from "../configuration/settings";
import { getFileExt } from "../helpers/stringTools";
import dictionary from "../configuration/dictionary";
import { log } from "../services/Logger";

import JsonMap from "./JsonMap";

class MapLoader {
  /**
   * Конструктор
   * Получает идентификатор, данные, колбек изменения, настройки
   */
  constructor(id, data, options) {
    this.id = id;
    this.data = data;
    this.loaded = false;
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
  }

  /**
   * Удаляем компоненты
   */
  destroy() {
    this.parsing = null;
    this.data = null;
    this.loaded = false;
  }

  /**
   *
   */
  load(path) {
    this.loaded = false;
    if (path != null) {
      let ext = getFileExt(path.toLowerCase());
      let mapFactory = this.parsing[ext].factory;
      let map = new mapFactory(this.id, this.data, () => {}, this.parsing[ext]);
      map.setPath(path);
      map.load();
      this.loaded = map.loaded;
    }
  }
}

export default MapLoader;
