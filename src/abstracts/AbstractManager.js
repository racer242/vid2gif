/**
 * Менеджер
 * Абстрактный класс для использования как основа менеджеров
 * Управляет загрузкой карты своей области пространства
 * На основе загруженных данных, создает список подчиненных менеджеров
 * Осуществляет итеративный обход всех подчиненных менеджеров
 * Осуществляет итеративный обход своих карт
 *
 *
 * Идентификация по двум параметрам (для лога):
 * id (передается в конструктор),
 * extId (имя из переданных данных)
 */

import EmptyMap from "../configuration/EmptyMap";
import { registerLog, log } from "../services/Logger";
import dictionary from "../configuration/dictionary";

class AbstractManager {
  /**
   * Конструктор
   * Получает свой идентификатор, данные, колбек конца обхода подчиненных,
   * колбек создания подчиненного
   */
  constructor(id, data, finishCallback, createdCallback) {
    this.id = id;
    this.extId = data.name;
    this.current = null;
    this.data = data;
    this.finishCallback = finishCallback;
    this.createdCallback = createdCallback;

    // Получаем класс карты и создаем карту
    let dataMapClass = this.getMapFactory();
    this.dataMap = new dataMapClass(this.getChildId(this.data), this.data);

    // Создаем список подчиненных менеджеров
    this.managers = [];

    // Создаем список данных для подчиненных менеджеров
    this.list = [];

    this.isCreated = false;
    registerLog(this);
  }

  /**
   * Инициализируем компоненты
   */
  init() {
    return this.dataMap.init();
  }

  /**
   * Запуск работы
   */
  start() {
    this.dataMap.start();
  }

  /**
   * Удаляем компоненты
   */
  destroy() {
    this.destroyChildren();
    this.dataMap.destroy();
    this.finishCallback = null;
    this.data = null;
    this.current = null;
    this.managers = null;
    this.list = null;
  }

  /**
   * Создать подчиненных менеджеров
   */
  createChildren(list) {
    if (list) {
      this.managers = [];
      if (list.length == 0) {
        this.childCreated();
      } else {
        for (let i = 0; i < list.length; i++) {
          if (this.enableChild(list[i])) {
            let childData = this.prepareChildData(list[i]);
            let childClass = this.getChildFactory(childData);
            // console.log("createChildren",this.constructor.name,this.getChildId(this.data));
            let child = new childClass(
              this.getChildId(this.data),
              childData,
              () => {
                this.childFinished();
              },
              () => {
                this.childCreated();
              }
            );
            if (child.init()) {
              this.managers.push(child);
              child.start();
            }
          }
        }
        if (this.managers.length == 0) {
          this.childCreated();
        }
      }
    }
  }

  /**
   * Удалить подчиненных менеджеров
   */
  destroyChildren() {
    if (this.managers) {
      for (let i = 0; i < this.managers.length; i++) {
        this.managers[i].destroy();
      }
      // log(this,dictionary.log.managerListDestroyed);
    }
  }

  /**
   * Возвращает id для подчиненных
   * Может переопределяться потомками
   */
  getChildId(data) {
    return this.id + "/" + this.extId;
  }

  /**
   * Возвращает класс для подчиненных
   * Для использования потомками
   */
  getChildFactory(data) {
    return null;
  }

  /**
   * Подготовка данных для подчиненного, перед тем как их передать в его конструктор
   * Для использования потомками
   */
  prepareChildData(data) {
    return data;
  }

  /**
   * Используется для фильтрации потомков
   * Для использования потомками
   */
  enableChild(data) {
    return true;
  }

  /**
   * Возвращает класс карты
   * Для использования потомками
   */
  getMapFactory() {
    return EmptyMap;
  }

  /**
   * Действия, когда закончен обход мониторинга подчиненных у подчиненного
   */
  childFinished() {
    this.goNext();
  }

  /**
   * Вызвать колбек завершения обхода мониторинга подчиненных
   */
  callFinishCallback() {
    if (this.finishCallback) {
      this.finishCallback();
    }
  }

  /**
   * Проверка, все ли подчиненные созданы
   */
  checkChildrenAreCreated() {
    if (this.managers) {
      for (let i = 0; i < this.managers.length; i++) {
        if (this.managers[i].isActive() && !this.managers[i].isCreated) {
          // TODO: !!!! ОЧЕНЬ ВАЖНО !!! Если какой-то чайлд не отправит сообщение и подвиснет - смотреть тут
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Действия, когда закончено создание подчиненного и его подчиненных
   * Если подчиненный менеджер создан, то просто идет отправка колбека о том,
   * что элементы созданы. Иначе ожидание, пока все элементы не будут созданы
   */
  childCreated() {
    // Если менеджер отмечен как созданный, но пришло событие создания от подчиненного,
    // статус сбрасывается и снова вступает в силу ожидание что все создались.
    // Иначе, проверка на общую готовность подчиненных и выдача колбека о готовности создания
    if (this.isCreated) {
      this.isCreated = false;
      this.childCreated();
    } else if (this.checkChildrenAreCreated()) {
      this.isCreated = true;
      this.callCreatedCallback();
    }
  }

  /**
   * Вызвать колбек о своем создании
   */
  callCreatedCallback() {
    if (this.createdCallback) {
      this.createdCallback();
    }
  }

  /**
   * Показывает, актиен ли менеджер. Для использования потомками
   */
  isActive() {
    return true;
  }

  /**
   * Показывает, активны ли подчиненные. Для использования потомками
   */
  childrenAreActive() {
    return true;
  }

  /**
   * Перейти к итерации следующего подчиненного
   */
  goNext() {
    // Если текущий подчиненный не установлен, установить первого в списке
    // подчиненных менеджеров. Если нет ни одного подчиненного - сразу колбек о
    // конце обхода подчиненных.
    // Если текущий подчиненный присутствует, поиск следующего. Если найден -
    // устанавливается, если текущий был последним в списке - колбек о конце
    // обхода. В случае неуспеха поиска следующего подчиненного, текущий
    // обнуляется и вызов колбека конца обхода.
    if (!this.current) {
      if (this.managers.length > 0) {
        this.current = this.managers[0];
      } else {
        this.current = null;
        this.callFinishCallback();
      }
    } else {
      let index = this.managers.indexOf(this.current);
      if (index >= 0) {
        index++;
        if (index === this.managers.length) {
          this.current = null;
          this.callFinishCallback();
        } else {
          this.current = this.managers[index];
        }
      } else {
        this.current = null;
        this.callFinishCallback();
      }
    }
  }

  /**
   * Итерация обновления менеджера
   */
  update(data) {
    // Обновление карты данных менеджера
    this.dataMap.update(this.data);

    // Если список данных подчиненных изменился, пересоздать всех подчиненных
    if (this.list !== this.data.list) {
      this.list = this.data.list;
      this.destroyChildren();
      this.current = null;
      this.isCreated = false;
      this.createChildren(this.list);
    }

    // Если текущий подчиненный менеджер активен, и подчиненные так же подлежат
    // активности, выполняем итерацию обновления текущего менеджера
    // Иначе, переходим к следующему подчиненному
    if (this.current && this.current.isActive() && this.childrenAreActive()) {
      this.current.update(data);
    } else {
      this.goNext();
    }
  }
}

export default AbstractManager;
