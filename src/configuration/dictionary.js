const dictionary = {
  responces: {
    error404: {
      error: "request",
      message: "Запрос не предусмотрен",
    },
    error404Internal: {
      error: "resource",
      message: "Запрашиваемый ресурс недоступен",
    },
    index: {
      about: "Adverter API. Сервис автосборки баннеров.",
    },
    dashboard: {},
    error: {
      error: "server",
      content: "Внутренняя ошибка сервера",
    },
  },

  log: {
    converterStartMessage: "Сервис запущен",
    converterStopMessage: "Сервис остановлен",

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
    mapSheetNotFoundError: "04:В xlsx файле не найден лист с картой",
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

    publicIpError: "04:Ошибка получения глобального IP-адреса",
    ipAddressGot: "IP адреса получены",
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
