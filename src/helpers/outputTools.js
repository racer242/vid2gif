import dictionary from "../configuration/dictionary";

// Вывод активности в консоль
export const displayIteration = (cycleCounter, stepCounter) => {
  let supported = true;
  try {
    process.stdout.cursorTo(0);
    process.stdout.clearLine();
  } catch (error) {
    supported = false;
  }
  if (supported) {
    process.stdout.write(
      "\x1b[32m" +
        " Cycle:" +
        "\x1b[0m" +
        cycleCounter +
        "\x1b[32m" +
        " Step:" +
        "\x1b[0m" +
        stepCounter +
        " " +
        "\x1b[32m" +
        dictionary.animation[
          (cycleCounter + stepCounter) % dictionary.animation.length
        ] +
        "\x1b[0m"
    );
    process.stdout.cursorTo(0);
  }
};
