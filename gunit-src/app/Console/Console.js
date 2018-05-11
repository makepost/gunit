const { ByteArray } = imports.byteArray;
const {
  DataInputStream,
  DataOutputStream,
  UnixInputStream,
  UnixOutputStream
} = imports.gi.Gio;
const GLib = imports.gi.GLib;
const { ConsoleTerminal } = require("../../domain/Console/ConsoleTerminal");
const { FileDescriptor } = require("../../domain/File/FileDescriptor");
const { Async } = require("../Async/Async");
const { ErrorStack } = require("../Error/ErrorStack");

/**
 * Prompts you for JavaScript expressions to run asynchronously, not blocking
 * the main loop. Lets you move cursor and edit characters.
 */
class Console {
  get expression() {
    const terminal = this.terminal;
    const str = this.sequence;
    let cursor = 0;
    let expression = "";

    for (let i = 0; i < str.length; i++) {
      const charIncluded = str.slice(0, i + 1);

      if (
        str[i] === terminal.backspace &&
        expression[expression.length + cursor - 1] !== "\n"
      ) {
        expression =
          expression.slice(0, expression.length + cursor - 1) +
          expression.slice(expression.length + cursor);

        continue;
      }

      if (str[i] === terminal.backspace) {
        continue;
      }

      if (
        str[i] === terminal.cutBackwards &&
        expression[expression.length + cursor - 1] !== "\n"
      ) {
        expression =
          expression
            .slice(0, expression.length + cursor)
            .replace(/[^\s]+$/, "") +
          expression.slice(expression.length + cursor);

        continue;
      }

      if (str[i] === terminal.cutBackwards) {
        continue;
      }

      if (
        str[i] === terminal.escape[0] ||
        charIncluded.endsWith(terminal.escape)
      ) {
        continue;
      }

      if (charIncluded.endsWith(terminal.cursorRight) && cursor < 0) {
        cursor++;
        continue;
      }

      if (
        charIncluded.endsWith(terminal.cursorLeft) &&
        cursor > -expression.length &&
        expression[expression.length + cursor - 1] !== "\n"
      ) {
        cursor--;
        continue;
      }

      if (str.slice(0, i).endsWith(terminal.escape)) {
        // Unknown escape sequence.
        continue;
      }

      expression =
        expression.slice(0, expression.length + cursor) +
        str[i] +
        expression.slice(expression.length + cursor);
    }

    for (let i = cursor; i < 0; i++) {
      expression += terminal.cursorLeft;
    }

    return expression;
  }

  get sequence() {
    const length = this.bytes.reduce((prev, x) => prev + x.length, 0);
    const bytes = new ByteArray(length);
    let i = 0;

    for (const x of this.bytes) {
      for (let j = 0; j < x.length; j++) {
        // @ts-ignore TODO: Add indexer to byte array typings.
        bytes[i] = x[j];
        i++;
      }
    }

    return String(bytes);
  }

  constructor() {
    /** @type {ByteArray[]} */
    this.bytes = [];

    // TODO: Edit and re-run previous expression.
    // /** @type {string[]} */
    // this.history = [];

    this.input = new DataInputStream({
      base_stream: new UnixInputStream({ fd: FileDescriptor.Input })
    });

    this.loop = imports.mainloop;

    this.output = new DataOutputStream({
      base_stream: new UnixOutputStream({ fd: FileDescriptor.Output })
    });

    this.prompt = "mainloop> ";

    this.terminal = new ConsoleTerminal();
  }

  cancel() {
    // Made a mistake? ^D to clear and start again.
    this.clear();
    this.output.put_string(`\n${this.terminal.saveCursor}`, null);
  }

  clear() {
    this.bytes.splice(0);
  }

  /**
   * @param {Error} error
   */
  error(error) {
    if (error.constructor === SyntaxError) {
      // Prompt for another bytes line.
      return;
    }

    this.clear();

    this.output.put_string(
      `${error.name}: ${error.message}\n${this.terminal.saveCursor}`,
      null
    );

    const stack = new ErrorStack(error)
      .remove("gunit-src/app/Console")
      .remove("gjs/modules/mainloop")
      .toString();

    if (stack) {
      this.output.put_string(`${stack}\n${this.terminal.saveCursor}`, null);
    }
  }

  eval() {
    // TODO: Push expression to history.
    // this.history.push(this.expression);

    this.output.put_string(
      // tslint:disable-next-line:no-eval
      `${eval(this.expression)}\n${this.terminal.saveCursor}`,
      null
    );

    this.clear();
  }

  quit() {
    this.output.put_string(`\n${this.terminal.saveCursor}`, null);
    this.loop.quit();
  }

  async read() {
    const terminal = this.terminal;

    this.output.put_string(
      `${terminal.restoreCursor}${terminal.deleteDown}${terminal.deleteRight}`,
      null
    );

    this.output.put_string(`${this.prompt}${this.expression}`, null);

    this.bytes.push(
      await Async.fromGio(
        readyCallback =>
          this.input.read_bytes_async(
            3, // Ascii 1, unicode 2, escape sequence 3.
            GLib.PRIORITY_LOW,
            null,
            readyCallback
          ),

        asyncResult =>
          imports.byteArray.fromGBytes(
            this.input.read_bytes_finish(asyncResult)
          )
      )
    );
  }

  run() {
    (async () => {
      this.output.put_string(this.terminal.saveCursor, null);

      while (true) {
        await this.read();

        // Inside loop, because maybe you replace the reference.
        const terminal = this.terminal;

        if (this.expression === terminal.endOfTransmission) {
          this.quit();
        } else if (this.expression.endsWith(terminal.endOfTransmission)) {
          this.cancel();
        } else if (this.expression.endsWith("\n")) {
          this.output.put_string("\n", null);

          // TODO: Debug.
          // this.output.put_string(`DEBUG: ${JSON.stringify(this.sequence)}\n`, null);

          try {
            this.eval();
          } catch (error) {
            this.error(error);
          }
        }
      }
    })().catch(print);

    this.loop.run();
  }
}

exports.Console = Console;
