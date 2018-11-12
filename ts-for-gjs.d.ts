/// <reference path="node_modules/ts-for-gjs/out/print.d.ts" />
import * as Gio from "ts-for-gjs/out/Gio";
import * as Gjs from "ts-for-gjs/out/Gjs";
import * as GLib from "ts-for-gjs/out/GLib";

declare global {
  function log(message?: string): void
  const ARGV: string[]
  const imports: typeof Gjs & {
    [key: string]: any
    gi: { Gio: typeof Gio, GLib: typeof GLib }
    searchPath: string[]
  }
}
export { }