/**
* Сервис ведения логов работы приложения
* Методы сервиса вызываются из управляющих модулей приложения
*
* Сервис выводит сообщения в консоль, в файлы подробных логов,в файлы кратких
* логов
* Логи присутствуют во всех директориях структуры облака Adverter
* Куда выводить - указывается в параметрах сообщений (средство вывода,
* уровень важности)
*
* Средства вывода:
* 0 - сообщение выводится на экран и записывается в лог
* 1 - сообщение выводится только на экран
* 2 - сообщение записывается в лог
* 3 - сообщение выводится на экран и записывается в лог и в краткий лог
*
* Уровень важности:
* 0 - обычный уровень
* 1 - средний уровень важности 1
* 2 - средний уровень важности 2
* 3 - критический уровень важности 1
* 4 - критический уровень важности 2
* 5 - сервисный уровень
*/

import fs from 'fs'
import awStream from 'awaitify-stream'
import {contractString, getFilePath} from "../helpers/stringTools"
import {makeDir,getFileSize} from "../helpers/fileTools"

import xxhash from 'xxhashjs'

import pt from 'path';

var loggerInstance;

// TODO:
// Архивация логов при достижении большого размера. Остается последняя часть лога, остальное уходит в архив ZIP в той же папке
// Лог последней сборки. Специальный лог, который записывает всю информацию последней сборки креатива. Перед сборкой лог очищается
// Лог сборки кампании, сокращенный

/*
  Класс логгирования событий
  Используются только статические методы:
  - init
  - registerLog
  - log
  Они обеспечивают взаимодействие с синглтоном логгера.
*/
class Logger {

  constructor() {
    this.params={
      logFileName:"log.txt", //имя файла лога (добавляется к пути директории назначения)
      appName:"", //Идентификатор приложения, которое вносит в лог запись
      clearLogs:false, //удалить (очистить) логи перед их регистрацией
      errorLogId:"ERROR_LOG", // идентификатор лога ошибок логгирования. При отсутствии, ошибки логгирования фиксируются в системный лог
      systemLogId:"SYSTEM_LOG", //идентификатор лога, наличие которого является обязательным. При отсутствии генерируется исключение
      useConsole:true, //Выводить сообщения в консоль
      messageLevelMacros:/^(\d)(\d)\:(.+)$/igm,
      flushLogTimeout:5000, //Интервал, через который проходит сохранение логов
      flushLogTimeoutVarience:2000, //Разброс начала интервала
      cacheMaxLength:65536,  //Максимальная длина кэша лога. Если превышает - принудительное сохранение лога

      maxFileSize:30000000, //Максимальный размер фала блога. При превышении, лог перемещается в архив и начинается запись нового лога
      logArchiveLocation:null, //Место расположения архива логов. Сюда отправляются логи, которые превысили лимит по размеру
      logArchiveFileName:"log_{timestamp}.txt", //Имя файла лога для отправки в архив

      startMessage: "\n\n\n\n==================================================================================================== $timestamp$ ====\n", //Стартовое сообщение в консоль
      dateWidth:22, //Ширина области строки консоли под дату
      idWidth:65, //Ширина области строки консоли под идентификатор источника данных
      sourceWidth:90, //Ширина области строки консоли под источник данных
      newLine:"\x1b[90m"+"↓\n→"+"\x1b[0m", //Текст перевода на новуюстрочку - если в параметры log поступает строка "\n"
      indentWidth:21, //Ширина отступа при переводе строки
      logMessageDictionary:null, // Если сообщения кодируются идентификаторами, то здесь задается словарь, в котором ключи - идентификаторы, значения - сообщения
      maxMessageRepeat:10, // Максимальное количество повторения одного и того же события прежде чем сработает трекинг
      loopedMessageTimeout:5000,
      undefinedLogError:"Impossible to write data to undefined log", //Тексты ошибок лога
      logSaveError:"Unable to save log on disk",
      undefinedErrorLog:"Error log isn't defined. Data will be written to system log",
      systemLogSaveError:"Unable to save system log on disk. Some log data may be lost",
      loopedMessageDetected:"Looped logging is temporary stopped for: ",
      consoleLevelColors: [ //Цвета подсветки сообщений
        "\x1b[36m",// 0 - обычный уровень
        "\x1b[35m",// 1 - средний уровень важности 1
        "\x1b[32m",// 2 - средний уровень важности 2
        "\x1b[31m",// 3 - критический уровень важности 1
        "\x1b[91m",// 4 - критический уровень важности 2
        "\x1b[33m",// 5 - служебный уровень
      ],
      consoleOutputLevels:null,
      archivedLogMessage:"Log was archived to {archiveName}",
      logToBuffer:false, //сохранять лог не в файл/консоль, а в буффер. Очистка буффера ручная. Нужно для случаев, когда надо передать лог во внешнюю обработку
      consoleBuffer:null, //буферная консоль - массив-буфер в который записываются все записи консоли
      consoleBufferMaxLines:20, //максимальное количество сообщений, записываемых в буфферную консоль. При переполнении ранние удаляются
    };

    this.ids={
      id:this.params.systemLogId,
      name:this.constructor.name,
      extId:"",
    }
  }

  async destroy() {
    await this.flushLogs();
  }

// Служебные функции ***********************************************************
  getSourceId(source) {
    if (source) {
      if (typeof(source)!=="string") {
        if (source.logId) {
          source=source.logId;
        } else
        if (source.id) {
          source=source.id;
        }
      }
      return source;
    }
    return this.params.systemLogId;
  }

  getSourceExtId(source) {
    if (source) {
      if (typeof(source)!=="string") {
        if (source.extId) {
          let result=source.extId;
          if (source.varId) {
            result=result+"/"+source.varId;
          }
          return result;
        }
      }
    }
    return "";
  }

  getSourceName(source) {
    if (!source) {
      source="-"
    } else
    if (typeof(source)!=="string") {
      if (source.constructor) {
        source=source.constructor.name
      } else
      if (source.name) {
        source=source.name;
      } else
      if (source.id) {
        source=source.id;
      }
    }
    return source;
  }

  // Выделяет из сообщения средство вывода и уровень важности.
  getMessageProps(message) {
    let level=0;
    let media=0;
    let matches=(new RegExp(this.params.messageLevelMacros.source,this.params.messageLevelMacros.flags)).exec(message);
    if (matches) {
      media=Number(matches[1]);
      level=Number(matches[2]);
      message=matches[3];
    }
    return {level:level,media:media,message:message};
  }

  composeData(ids,message,args) {

    let id=ids.id;
    let extId=ids.extId;
    if (extId!="") id+="/"+extId;
    let source=ids.name;

    if (!args) args=[];
    args=args.concat();
    for (let i = 0; i < args.length; i++) {
      let param=args[i];
      if (param==="\n") continue;
      if (param===undefined) param="null";
      let type=typeof(param);
      if ((type!=="string")&&(type!=="number")&&(type!=="boolean")) {
        if ((param)&&(param.stack)) {
          param=param.stack;
        } else {
          param=JSON.stringify(param);
        }
      }
      args[i]=param;
    }

    return (new Date()).toLocaleString()+" "+this.params.appName+"/"+id+"("+source+") "+message+" > "+args.join(" ")+"\n";
  }

// Регистрация сообщений логов *************************************************

// Вывод лога в консоль
  logToConsole(ids,level,message,args) {
    if (
        (this.params.useConsole)&&
        ((!this.params.consoleOutputLevels)||
          (
            this.params.consoleOutputLevels.indexOf(level)>=0
          ))
      ) {
      let id=ids.id;
      let extId=ids.extId;
      if (extId!="") id+="/"+extId

      let fullId=this.params.appName+"/"+id
      id=contractString(fullId,this.params.idWidth,10,2,true);
      let source=contractString(ids.name,this.params.sourceWidth-this.params.idWidth);
      let date=(new Date()).toLocaleString();

      let outString=[
        "\x1b[90m"+(date+" ...").padEnd(this.params.dateWidth,".")+"\x1b[0m",
        (
          (id+"\x1b[90m"+" .").padEnd(this.params.idWidth+7,".")+"\x1b[0m"+" "+
          (source+"\x1b[90m"+" ...")
        ).padEnd(this.params.sourceWidth+21,".")+"\x1b[0m",
        this.params.consoleLevelColors[level]+message+"\x1b[0m",
      ];

      let outData=[];
      if ((args)&&(args.length>0)) {
        outString.push("\x1b[90m...\x1b[0m");
        for (let i = 0; i < args.length; i++) {
          let arg=args[i];
          if (arg==="\n") arg=this.params.newLine+"".padEnd(this.params.indentWidth);
          if ((arg)&&((arg.constructor === Object)||(arg.constructor === Array))) {
            outData.push(arg);
          } else {
            outString.push(arg);
          }
        }
      }
      console.log.apply(this,outString);
      if (outData.length>0) {
        console.log("\x1b[90m"+"<<<"+"\x1b[0m"+" ");
        for (let i = 0; i < outData.length; i++) {
          console.dir(outData[i],{depth:null});
        }
        console.log("\x1b[90m"+">>>"+"\x1b[0m"+" ");
      }

      if (this.params.consoleBuffer) {
        this.logToConsoleBuffer([date,fullId,ids.name,message,args]);
      }
    }
  }

  // Записать строку в консольный буффер
  logToConsoleBuffer(message) {
    this.params.consoleBuffer.push(message);
    if (this.params.consoleBuffer.length>this.params.consoleBufferMaxLines) {
      this.params.consoleBuffer.splice(0,1);
    }
  }

// Записать данные в кэш лога
  async writeToLog(log,data) {
    log.cache+=data;
    if (log.cache.length>=this.params.cacheMaxLength) {
      await this.flushLog(log);
      this.startFlushTimeout(log);
    } else {
      if (!log.timeout) {
        this.startFlushTimeout(log);
      }
    }
  }

// Фиксация внутренних ошибок логов
  async logError(message,data)
  {
    let messageProps=this.getMessageProps(message);
    if (this.logs[this.params.errorLogId][0]) {
      this.logToConsole(this,messageProps.level,messageProps.message);
      await this.writeToLog(this.logs[this.params.errorLogId][0],this.composeData(this.ids,message,data));
    } else {
      let messageProps=this.getMessageProps(this.params.undefinedErrorLog);
      this.logToConsole(this,messageProps.level,messageProps.message);
      if (this.logs[this.params.systemLogId][0]) {
        this.logToConsole(this,messageProps.level,messageProps.message);
        await this.writeToLog(this.logs[this.params.systemLogId][0],this.composeData(this.ids,message,data));
      }
    }
  }

  async logToFile(ids,message,args)
  {
    if (this.logs[ids.id][ids.shadow]) {
      await this.writeToLog(this.logs[ids.id][ids.shadow],this.composeData(ids,message,args));
    } else {
      await this.logError(this.params.undefinedLogError,[{id:id,lost:args}]);
    }
  }

  logToBuffer(ids,message,args)
  {
    let log = this.logs[ids.id][ids.shadow];
    if ((log)&&(log.buffer)) {
      log.buffer.push(
        { message,
          args,
        }
      );
      return true;
    }
    return false;
  }

  /**
  * Отследить повторения сообщений. Если одно и тто же сообщение циклично
  * повторяется, блокировать его
  */
  trackLogContent(ids,message,args)
  {
    let result=true;
    if (this.logs[ids.id][ids.shadow]) {
      let log=this.logs[ids.id][ids.shadow];
      let id=ids.id;
      let name=ids.name;
      let extId=ids.extId;

      let hash=Number(xxhash.h32(name+id+extId+message+args.join(" "),0x1111).toString(10));
      let params;
      if (log.trackBuffer[hash]) {
        params=log.trackBuffer[hash];
        if (params.c>this.params.maxMessageRepeat) {
          if (!params.muted) {
            if (ids.shadow==0) {
              let loopedMessageProps=this.getMessageProps(this.params.loopedMessageDetected+this.getMessageProps(message).message);
              this.logToConsole(ids,loopedMessageProps.level,loopedMessageProps.message);
              this.logToFile(ids,loopedMessageProps.message);
            }
            params.muted=true;
          }
          result=false;
        } else {
          params.c++;
        }
      } else {
        log.trackBuffer[hash]=
        params={
          c:1,
        };
      }

      params.message=message;
      params.hash=hash;
      params.owner=log.trackBuffer;
      if (params.timeout) {
        clearTimeout(params.timeout);
      }
      params.timeout=setTimeout((function(){ delete this.owner[this.hash];}).bind(params),this.params.loopedMessageTimeout);
      return result;
    }
  }

// Сброс логов на диск *********************************************************

  startFlushTimeout(log) {
    let timeout=log.timeout;
    if (timeout) clearTimeout(timeout);
    timeout=this.params.flushLogTimeout+this.params.flushLogTimeoutVarience*Math.random();
    log.owner=this;
    log.timeout=setTimeout((
      async function() {
        await this.owner.flushLog(this);
        this.timeout=null;
        this.owner=null;
      }
    ).bind(log),timeout);
  }

  async flushLog(log) {
    if (log.cache.length>0) {
      if (log.path) {
        if (await this.saveLog(log)) {
          log.cache="";
        } else {
          await this.logError(this.params.logSaveError,[{id:log.id,path:log.path,lost:log.cache}]);
        }

      } else {
        // console.log("Path isn't defined yet for log:",log.id);
      }
    }
  }

  async flushLogs() {
    for (let id in this.logs) {
      for (let shadow in this.logs[id]) {
        let log = this.logs[id][shadow];
        await this.flushLog(log);
        if (log.timeout) clearTimeout(log.timeout);
        log.timeout=null;
      }
    }
  }

  getLogPath(log) {
    let result=log.path;
    if (log.folder) {
      result=pt.join(result,log.folder);
    }
    let fileName=this.params.logFileName;
    if (log.fileName) {
      fileName=log.fileName;
    }
    return pt.join(result,fileName);
  }

  async saveLog(log) {
    let path=this.getLogPath(log);


    let archiveName=null;
    if ((this.params.logArchiveLocation)&&(this.params.logArchiveLocation!="")&&(getFileSize(path)>this.params.maxFileSize)) {
      archiveName=this.params.logArchiveFileName.replace("{timestamp}",(new Date()).toLocaleString()).replace(/[\:]/gi,"_");
      let archivePath=pt.join(this.params.logArchiveLocation,archiveName);
      if (makeDir(getFilePath(archivePath))) {
        try {
          await fs.promises.rename(path, archivePath);
        } catch (error) {
          archiveName=null;
          console.log('Move log to archive error:',path,"=>",archivePath,error);
        }
      } else
      {
        console.log('Create log archive dir error:',path);
      }
    }


    if (!makeDir(getFilePath(path))) {
      console.log('Create log dir error:',path);
      return false;
    }
    let data=log.cache;

    if (archiveName) {
      data=this.params.archivedLogMessage.replace("{archiveName}",archiveName)+"\n"+data;
    }
    let logStream;
    try {
      logStream = fs.createWriteStream(path, {'flags': 'a'});
    } catch (error) {
      console.log('Create log stream error:',path,error.message);
      return false;
    }
    let writer = awStream.createWriter(logStream);
    try {
      await writer.writeAsync(data);
    } catch (error) {
      console.log('Write to log error:',path,error.message);
      return false;
    } finally {
      logStream.end();
    }
    return true;
  }

  deleteLog(path) {
    try {
      fs.unlinkSync(path);
      return true;
    } catch(error) {
      console.log('Delete log error:',path,error.message);
    }
    return false;
  }

// Основные методы интерфейса **************************************************

  init(params) {
    this.logs={};
    this.params={
      ...this.params,
      ...params,
    };

    if (this.params.useConsole) {
      console.log(this.params.startMessage.replace("$timestamp$",(new Date()).toLocaleString()));
    }
  }

  register(source,params) {
    let id=this.getSourceId(source);
    if (!params) params={};

    if (!this.logs[id]) {
      this.logs[id]={}
    }

    let shadow=0;
    if (params.shadow) {
      shadow=params.shadow;
    }

    if (!this.logs[id][shadow]) {
      this.logs[id][shadow]={
        id:id,
        path:"",
        cache:"",
        filter:"0,1,2,3",
        flushTimeout:null,
        trackBuffer:{},
      }
    }

    if (params.filter) {
      this.logs[id][shadow].filter=params.filter;
    }

    if (params.folder) {
      this.logs[id][shadow].folder=params.folder;
    }

    if (params.fileName) {
      this.logs[id][shadow].fileName=params.fileName;
    }

    if (params.logToBuffer) {
      this.logs[id][shadow].buffer=[];
    }

    if (params.path) {
      this.logs[id][shadow].path=params.path;
      if (this.params.clearLogs) {
        // TODO: вместо удаления сделать архивирование логов
        console.log("Delete log (becouse of env CLEAR_LOGS):",log.path);
        this.deleteLog(log.path);
      }
    }

  }

  async log(source,message,args)
  {
    let ids={
      id:this.getSourceId(source),
      name:this.getSourceName(source),
      extId:this.getSourceExtId(source),
    }
    if (this.logs[ids.id]) {
      for (let shadow in this.logs[ids.id]) {
        let log=this.logs[ids.id][shadow];

        ids.shadow=shadow;

        if (this.trackLogContent(ids,message,args)) {

          //Если лог ведется в буфер, то не производить больше никаких действий
          //с этой тенью лога и перейти к следующей
          if (this.logToBuffer(ids,message,args)) {
            continue;
          }

          let messageProps=this.getMessageProps(message);

          if (log.filter.indexOf(String(messageProps.media))>=0) {

            switch (messageProps.media) {
              case 0:{
                this.logToConsole(ids,messageProps.level,messageProps.message,args);
                this.logToFile(ids,messageProps.message,args);
                break;
              }
              case 1:{
                this.logToConsole(ids,messageProps.level,messageProps.message,args);
                break;
              }
              case 2:{
                this.logToFile(ids,messageProps.message,args);
                break;
              }
              case 3:{
                if (shadow==0) {
                  this.logToConsole(ids,messageProps.level,messageProps.message,args);
                }
                this.logToFile(ids,messageProps.message,args);
                break;
              }
              default:{
                this.logToConsole(ids,messageProps.level,messageProps.message,args);
              }
            }
          }
        }
      }
    }
  }

  getLogBuffer(source,shadow)
  {
    if (!shadow) {
      shadow="0"
    }
    let ids={
      id:this.getSourceId(source),
      name:this.getSourceName(source),
      extId:this.getSourceExtId(source),
      shadow:shadow,
    }
    if (this.logs[ids.id][ids.shadow]) {
      return this.logs[ids.id][ids.shadow].buffer;
    }
    return null;
  }

  clearLogBuffer(source,shadow)
  {
    if (!shadow) {
      shadow="0"
    }
    let ids={
      id:this.getSourceId(source),
      name:this.getSourceName(source),
      extId:this.getSourceExtId(source),
      shadow:shadow,
    }
    if (this.logs[ids.id][ids.shadow]) {
      this.logs[ids.id][ids.shadow].buffer=[];
    }
  }


}

// Статические методы

export function initLogger(params) {
  if (!loggerInstance) {
    loggerInstance = new Logger();
    loggerInstance.init(params);
  }
}

export function destroyLogger() {
  if (!loggerInstance) {
    throw new Error("Logger isn't instantiated. Create Logger before.")
  }
  loggerInstance.destroy();
  loggerInstance=null;
}

export function registerLog(source,params) {
  if (!loggerInstance) {
    throw new Error("Logger isn't instantiated. Create Logger before.")
  }
  loggerInstance.register(source,params);
}

export function log(source,message,...args) {
  if (!loggerInstance) {
    throw new Error("Logger isn't instantiated. Create Logger before.")
  }
  loggerInstance.log(source,message,args);
}

export function getLogBuffer(source,shadow) {
  if (!loggerInstance) {
    throw new Error("Logger isn't instantiated. Create Logger before.")
  }
  return loggerInstance.getLogBuffer(source,shadow);
}

export function clearLogBuffer(source,shadow) {
  if (!loggerInstance) {
    throw new Error("Logger isn't instantiated. Create Logger before.")
  }
  loggerInstance.clearLogBuffer(source,shadow);
}
