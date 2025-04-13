const dictionary = {
  responces: {
    taskAccepted: {
      message: "Задача принята в работу",
    },
    taskExists: {
      errorCode: "DOUBLE_ID",
      message: "Эта задача уже в работе",
    },
    taskCorrupted: {
      errorCode: "WRONG_HASH",
      message: "Нарушена целостность параметров запроса на выполнение задачи",
    },
    error404: {
      error: "request",
      message: "Запрос не предусмотрен",
    },
    error404Internal: {
      error: "resource",
      message: "Запрашиваемый ресурс недоступен",
    },
    index: {
      about: "API конвертера Video 2 Gif.",
    },
    dashboard: {},
    error: {
      error: "server",
      message: "Внутренняя ошибка сервера",
    },

    downloadError: {
      status: "ERROR",
      code: "WRONG_URL",
      message: "Ошибка скачивания",
    },
    convertError: {
      status: "ERROR",
      code: "CONVERT",
      message: "Ошибка конвертации",
    },

    taskCompleted: {
      status: "COMPLETED",
      message: "Успешно сконвертировано",
    },
  },

  log: {
    taskStarted: "02:Задача стартовала",
    taskVideoDownloaded: "02:Видео успешно загружено",
    taskImageDownloaded: "02:Изображение успешно загружено",
    taskPreview1Converted: "02:Preview1 успешно создано",
    taskPreview2Converted: "02:Preview2 успешно создано",
    taskGifConverted: "02:Gif успешно создан",
    taskCallback: "02:Callback успешно отправлен",
    taskAdded: "02:Задача добавлена в очередь",
    taskCompletes: "02:Задача завершена",
    uncompletedTasksDetected:
      "02:После перезагрузки обнаружены незавершенные задачи",

    downloadVideoError: "03:Ошибка скачивания видео",
    downloadImageError: "03:Ошибка скачивания изображения",
    convertPreviewError: "03:Ошибка конвертирования Preview",
    convertGifError: "03:Ошибка конвертирования GIF",
    saveTaskConfigError: "03:Не удалось сохранить файл конфигурации задачи",
    deleteError: "03:Не удается удалить файл",
    callbackError: "03:Не удается вызвать callback после завершения задачи",

    tooManyTasksError:
      "03:Нет возможности взять задачу в работу, все сборщики заняты",

    serviceStartMessage: "Сервис запущен",
    serviceStopMessage: "Сервис остановлен",
    consoleMessage: "02:Консольный вывод:",
    errorMessage: "03:Вывод ошибки:",

    undefinedLogError: "04:Попытка записи в незарегистрированный лог",
    logSaveError: "04:Не удалось записать лог на диск",
    undefinedErrorLog:
      "03:Лог для записи ошибок не задан. Ошибка будет записана в системный лог",
    systemLogSaveError:
      "04:Ошибка записи системного лога на диск. Записи могут быть потеряны",
    loopedMessageDetected: "01:Зацикленное сообщение временно отключено: ",
    errorIsLooping:
      "01:↑↑↑ Эта ошибка будет повторяться циклически, поэтому ее вывод отключен",
    archivedLogMessage: 'Лог был сохранен в архив "{archiveName}" и очищен',

    mapStarted: "Трекинг карты стартовал",
    mapChanged: "Трекер карты зафиксировал изменение файла карты",
    mapPathChanged: "Путь файла карты изменился",
    mapLoadError: "04:Ошибка загрузки/распаковки файла карты",
    mapIsEmptyError: "04:Карта не содержит данных",
    mapParseError: "04:Ошибка разбора карты",
    mapLoaded: "Карта успешно загружена",
    mapWrongExtensionError:
      "04:Указан файл карты незарегистрированного формата:",

    managerListCreated: "10:Создан новый список менеджеров",
    managerListDestroyed: "10:Cписок менеджеров очищен",

    trackingFileAcquired: "Файл принят под наблюдение",
    trackingFileUpdated: "При проверке было выявлено изменение файла/папки",
    trackingFileChanged:
      "В наблюдаемом пространстве обнаружено изменение файла",
    watchInitError: "03:Не удалось инициировать наблюдение за файлом",
    checkFileError: "03:Не удалось проверить файл на изменение",
    checkFileDoesntExistError:
      "03:Файл не найден. Не удалось проверить файл на изменение",
    ipAddressGot: "IP адрес",
  },

  replace: {
    replace: /\$replace\$/gi,
    destination: /\$destination\$/gi,
    source: /\$source\$/gi,
    id: /\$id\$/gi,
    timestamp: /\$timestamp\$/gi,

    section: /\$section\$/gi,
    publisher: /\$publisher\$/gi,
    format: /\$format\$/gi,
  },

  replacements: {
    ip: "{ip}",
  },

  animation: ["-", "-", "-", "\\", "\\", "\\", "|", "|", "|", "/", "/", "/"],
};
export default dictionary;
