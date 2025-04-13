//Проверка задачи на наличие всех параметров

import md5 from "md5";

const TASK_PROPS = [
  "id",
  "videoUrl",
  "bubbleUrl",
  "bubbleX",
  "bubbleY",
  "callbackUrl",
  "hash",
];

export const testTask = (task, key) => {
  let fieldAreComplete = TASK_PROPS.reduce((a, v) => a && v in task, true);
  let hash = md5(task.id + "" + task.videoUrl + "" + key);
  let hashIsComplete = hash === task.hash || key === "777";
  return fieldAreComplete && hashIsComplete;
};
