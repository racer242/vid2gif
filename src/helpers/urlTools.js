// Поскольку URL закодирован в красивый вид, декодируем его в путь на диске
// Принцип кодирования пути в URL (это делает converter когда готовит ярлык на dashboard):
// 1. Пробелы заменить на тильду - чтобы не отображалось %20, что некрасиво
// 2. Тильды тоже могут быть в адресе (но редко) - они заменяются на сигнатуру [~]
export const restoreDashboardPath = (url) => {

  // Сначала сигнатуру [~] заменим на временную сигнатуру (символ ^ не возможен в url)
  let path=url.replace(/\[\~\]/g,"^^");
  // Преобразуем тильды в пробелы
  path=path.replace(/\~/g," ");
  // Преобразуем временную сигнатуру в тильду
  path=path.replace(/\^\^/g,"~");

  return path;
}

// Защита от доступа к ресурсам сервера через подстановку в URL спецкодов
export const protectUrl = (url) => {

  // Удалим "выход на уровень вверх"
  url=url.replace(/\.\./g,"");

  return url;
}




// Разрешенные в url символы ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+,;=
