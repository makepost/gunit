const {
  DataInputStream,
  DataOutputStream,
  UnixInputStream,
  UnixOutputStream
} = imports.gi.Gio;
const GLib = imports.gi.GLib;
const { FileDescriptor } = require("../../domain/File/FileDescriptor");
const { Async } = require("../Async/Async");
const { ErrorStack } = require("../Error/ErrorStack");

class Console {
  constructor() {
    this.in = new DataInputStream({
      base_stream: new UnixInputStream({ fd: FileDescriptor.Input })
    });

    this.out = new DataOutputStream({
      base_stream: new UnixOutputStream({ fd: FileDescriptor.Output })
    });

    this.loop = imports.mainloop;
  }

  run() {
    (async () => {
      let buffer = "";

      while (true) {
        this.out.put_string(buffer ? "... " : "mainloop> ", null);

        const [line] = await Async.fromGio(
          readyCallback =>
            this.in.read_line_async(GLib.PRIORITY_LOW, null, readyCallback),

          asyncResult => this.in.read_line_finish_utf8(asyncResult)
        );

        if (line === null && buffer) {
          // Made a mistake? Let's clear and start again.
          buffer = "";
        } else if (line === null) {
          this.out.put_string("", null);
          this.loop.quit();
          return;
        } else {
          buffer += line;

          try {
            // tslint:disable-next-line:no-eval
            this.out.put_string(eval(buffer) + "\n", null);

            buffer = "";
          } catch (error) {
            if (error.constructor === SyntaxError) {
              // Prompt for another buffer line.
            } else {
              buffer = "";

              this.out.put_string(
                error.name + ": " + error.message + "\n",
                null
              );

              const stack = new ErrorStack(error)
                .remove("gunit-src/app/Console")
                .remove("gjs/modules/mainloop")
                .toString();

              if (stack) {
                this.out.put_string(stack + "\n", null);
              }
            }
          }
        }
      }
    })();

    this.loop.run();
  }
}

exports.Console = Console;
