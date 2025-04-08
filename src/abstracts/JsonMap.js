/**
* Карта JSON-конфигурации
* Абстрактный класс для использования как основа карт
* Загружает карту из JSON-файла
*/

import AbstractMap from './AbstractMap';
import {readFile} from "../helpers/fileTools"
import {log} from "../services/Logger"
import dictionary from '../configuration/dictionary';
import dirtyJson from 'dirty-json'

class JsonMap extends AbstractMap{

  /**
  * Конструктор
  */
  constructor(id,data,changedCallback,options) {
    super(id,data,changedCallback);
    if (options) {
      this.parser=options.parser;
      this.errorDataSetter=options.errorDataSetter;
    }
    // Если не задан парсер, по умолчанию простой перенос из
    // считанного объекта в объект данных
    if (!this.parser) {
      this.parser=(obj,data)=>{
        for (let key in obj) {
          data[key]=obj[key];
        }
        return true;
      }
    }

    if (!this.errorDataSetter) {
      this.errorDataSetter = (data)=>{}
    }
  }

  /**
  * Считать карту в json формате
  */
  read(path)
  {
    let result;
    let rawJson=readFile(path);
    if (!rawJson) {
      log(this,dictionary.log.mapLoadError,this.path,error);
      result = null;
    } else {
      try {
        result = dirtyJson.parse(rawJson);
        if (!result) {
          log(this,dictionary.log.mapIsEmptyError,this.path);
        }
      } catch (error) {
        log(this,dictionary.log.mapParseError,this.path,error);
        result = null;
      }
    }
    return result;
  }

}

export default JsonMap;
