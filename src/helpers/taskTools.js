//Проверка задачи на наличие всех параметров

const TASK_PROPS = ["id", "url", "type", "img", "x", "y", "callback"];

export const testTask = (task) => {
  return TASK_PROPS.reduce((a, v) => a && v in task, true);
};
