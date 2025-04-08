import express from "express";
import path from "path"
import settings from "../configuration/settings.js";
import dictionary from "../configuration/dictionary.js";
import { zip, COMPRESSION_LEVEL } from 'zip-a-folder';

import xxhash from 'xxhashjs'

import {getMatches, getFileNameExt, getFilePath} from "../helpers/stringTools.js";
import {restoreDashboardPath, protectUrl} from "../helpers/urlTools.js";
import {getFolderFiles, pathExists, collectFiles} from "../helpers/fileTools.js";

import {getConfiguration} from "../configuration/Configuration.js"

var zipCollectRouter = express.Router();

var downloadCount = 0;

/* GET home page. */
zipCollectRouter.get('/*', function(req, res, next) {

  // Получаем путь, начиная с базового
  let reqPath=req.params[0];

  // Обеспечим безопасность пути
  reqPath=protectUrl(reqPath);

  // Получаем по регулярному выражению список из трех компонентов пути - клиент, кампания, файл с относительными путями
  let matches=getMatches(/([^/]+)\/([^/]+)\/([\s\S]*)/gi,reqPath,3)

  // Список обязательно должен содержать 3 компонента. Если меньше - url неверный - игнор.
  // И еще - на конце пути должен быть обязательно слэш. Иначе относительнвй путь у дашборда будет неверный. Это учитывается нашей проверкой
  if ((matches)&&(matches[0])&&(matches[0].length===3)) {

    // Проверяем, нет ли переполнения задач
    if (downloadCount>settings.downloadLimit) {
      res.send({error:"Zip download limit exceeded"});
      res.end();
      return;
    } else {
      downloadCount++;
    }

    let clientUrlName=matches[0][0]; //Имя клиента
    let campUrlName=matches[0][1]; //Имя кампании

  // Наш URL имеет красивый внешний вид, без спецсимволов.
  // Поэтому, обработаем два параметра и вернем им нужный вид
    let clientName=restoreDashboardPath(matches[0][0]); //Имя клиента
    let campName=restoreDashboardPath(matches[0][1]); //Имя кампании

    // Проверяем, есть ли доступ к кампании и можно ли взять файл. Если токен не подходит, проверяем, расшарена ли кампания
    if (req.headers.token!=settings.secretTokens.download) {

      let isShared = false;

      // Токен для неавторизованного просмотра - пользователь смотри неавторизованно с сайта
      if (req.headers.token==settings.secretTokens.download_u) {
        let filePath=path.join(getConfiguration().cloudLocation,clientName,campName,settings.shareFileName);
        filePath=path.resolve(filePath);
        if (pathExists(filePath)) {
          isShared = true;
        }
      }

      // Нет разрешения получить файл
      if (!isShared) {
        console.log("Authorization failed:",reqPath);
        downloadCount--;
        res.status(403)
        res.end();
        return;
      }
    }

    let targetList=(req.body)?req.body:[];

    // Собираем файлы из папки,которую надо архивировать
    let files=[];

    if (targetList.length==0) {
      // Получаем путь до папки на диске
      let filePath=path.join(getConfiguration().cloudLocation,clientName,campName,settings.productFolderName,settings.publishFolderName);
      // Резолвим путь, чтобы он был правильным
      filePath=path.resolve(filePath);
      // Используем функцию, которая возвращает все файлы в папке и подпапках с относительными путями
      let fileList=getFolderFiles(filePath)
      for (let name in fileList) {
        files.push({ path: fileList[name], name: name, folder:"" })
      }
    } else {
      // Получаем путь до папки на диске
      let filePath=path.join(getConfiguration().cloudLocation,clientName,campName,settings.productFolderName);
      // Резолвим путь, чтобы он был правильным
      filePath=path.resolve(filePath);
      for (let i = 0; i < targetList.length; i++) {
        let targetItem=targetList[i];
        let backupPath;
        let backupName;
        let zipPath;
        let zipName;
        if (targetItem.backup) {
          backupPath=path.join(filePath,targetItem.backup);
          backupName=getFileNameExt(targetItem.backup);
          let backupFolder=getFilePath(targetItem.backup.replace(settings.publishFolderName,""));
          files.push({ path: backupPath, name: backupName, folder:backupFolder })
        }
        if (targetItem.zip) {
          zipPath=path.join(filePath,targetItem.zip);
          zipName=getFileNameExt(targetItem.zip);
          let zipFolder=getFilePath(targetItem.zip.replace(settings.publishFolderName,""));
          if (zipPath!==backupPath) {
            files.push({ path: zipPath, name: zipName, folder:zipFolder })
          }
        }
      }
    }

    // Получаем имя архива
    let fileName=campName.replace(/\s+/gi,"_");
    // Собираем файлы для архивации
    let zipPathObject={};
    let zipSignature=xxhash.h32(fileName,(new Date()).getTime()).toString(10);
    let zipLink=settings.downloadLink+clientUrlName+"/"+campUrlName+"/"+zipSignature+"/"+fileName+".zip";
    for (let i = 0; i < files.length; i++) {
      let fileItem=files[i];
      zipPathObject[path.join(fileItem.folder,fileItem.name)]=fileItem.path;
    }
    let zipPath=path.join(getConfiguration().cacheLocation,zipSignature);
    let collectPath=path.join(zipPath,"files");
    collectFiles(zipPathObject,collectPath,async (errors) => {
      if (errors) {
        res.send({error:"Collect files error: "+collectPath,errors});
        res.end();
      } else {
        // Архивируем и отправляем ссылку на архив
        let sourcePath=collectPath;
        let destPath=path.join(zipPath,settings.campZipName);
        try {
          await zip(sourcePath, destPath, {compression: COMPRESSION_LEVEL.high});
        } catch (error) {
          downloadCount--;
          res.send({error:"Zip files error: "+collectPath+" "+error.message});
          res.end();
          return;
        }
        downloadCount--;
        res.send({signature:zipSignature,link:zipLink});
        res.end();
      }
    });
  } else {
    next();
  }

});

export default zipCollectRouter;
