/**
* Карта конфигурации
* Абстрактный класс для использования как основа карт
* Загружает карту по заданному в потомках способу
* Отслеживает изменение файла и заново загружает, если обновился
* Отправляет событие при обновлении
*
* Идентификация по двум параметрам (для лога):
* id (передается в конструктор),
* extId (имя из переданных данных)
*/

import pt from 'path';
import settings from '../configuration/settings';
import FileUpdateTracker from '../trackers/FileUpdateTracker';
import {getFileTime} from "../helpers/fileTools"
import {getFilePath} from "../helpers/stringTools"
import dictionary from '../configuration/dictionary';
import {log} from "../services/Logger"

class AbstractMap {

  /**
  * Конструктор
  * Получает идентификатор, данные, колбек изменения
  */
  constructor(id,data,changedCallback) {
    this.id=id;
    this.extId=data.name;
    this.path=null;
    this.data=data;
    this.loaded=false;
    this.changedCallback=changedCallback;
    this.parser=null;
    this.errorDataSetter=null;
  }

  /**
  * Установка пути
  */
  setPath(filePath)
  {
    this.path=filePath;
  }

  /**
  * Инициализируем компоненты
  */
  init(filePath)
  {
    // Создаем трекер обновления
    this.updateTracker = new FileUpdateTracker(
      ()=>{
        if (!this.load()) {
          if (this.errorDataSetter) {
            this.errorDataSetter(this.data)
          } else {
            this.data=null;
          }
        }
      }
    );
    this.setPath(filePath);
    this.updateTracker.setPath(this.path);
    this.updateTracker.id=this.id;
    this.updateTracker.extId=this.extId;
    return true;
  }

  /**
  * Удаляем компоненты
  */
  destroy()
  {
    if (this.updateTracker) { this.updateTracker.destroy(); }
    this.data=null;
    this.loaded=false;
    this.changedCallback=null;
  }

  /**
  * Запуск работы
  */
  start()
  {
  }

  /**
  * Итерация обновления. Проверка пути или файла
  */
  update(data)
  {
    // Итерация обновления трекера изменений файла
    this.updateTracker.update();
  }

  /**
  * Считать карту
  * Используется потомками
  */
  read(path)
  {
    return null;
  }

  /**
  * Загрузить карту
  */
  load()
  {
    this.loaded = false;
    let result = this.read(this.path);
    if (!result) {
      return false;
    }

    if (this.parser){
      if (!this.parser(result,this.data)) {
        log(this,dictionary.log.mapParseError,this.path);
        return false;
      }
    } else {
      return false;
      log(this,dictionary.log.mapWrongExtensionError,this.path);
    }
    this.data.time=getFileTime(this.path);
    this.loaded=true;
    if (this.changedCallback) {
      this.changedCallback();
      log(this,dictionary.log.mapLoaded,this.path);
    }
    return true;
  }

}

export default AbstractMap;
