class ConsoleTerminal {
  get cursorLeft() {
    return `${this.escape}D`;
  }

  get cursorRight() {
    return `${this.escape}C`;
  }

  get deleteDown() {
    return `${this.escape}J`;
  }

  get deleteRight() {
    return `${this.escape}K`;
  }

  get restoreCursor() {
    return `${this.escape}u`;
  }

  get saveCursor() {
    return `${this.escape}s`;
  }

  constructor() {
    this.backspace = "\u007f";

    this.cutBackwards = "\u0017";

    this.endOfTransmission = "\u0004";

    this.escape = "\u001b[";
  }
}

exports.ConsoleTerminal = ConsoleTerminal;
