const {
  DataInputStream,
  DataOutputStream,
  UnixInputStream,
  UnixOutputStream
} = imports.gi.Gio;
const GLib = imports.gi.GLib;
const { FileDescriptor } = require("../../domain/File/FileDescriptor");
const { Async } = require("../Async/Async");

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
      while (true) {
        this.out.put_string("mainloop> ", null);

        const [line] = await Async.fromGio(
          readyCallback =>
            this.in.read_line_async(GLib.PRIORITY_LOW, null, readyCallback),

          asyncResult => this.in.read_line_finish_utf8(asyncResult)
        );

        if (line === null) {
          this.loop.quit();
          return;
        }

        try {
          // tslint:disable-next-line:no-eval
          this.out.put_string(eval(line) + "\n", null);
        } catch (error) {
          this.out.put_string(error.message + "\n" + error.stack + "\n", null);
        }
      }
    })();

    this.loop.run();
  }
}

exports.Console = Console;
