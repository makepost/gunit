const { File, FileQueryInfoFlags, FileType } = imports.gi.Gio;

class Flatten {
  /**
   * Given a point in a file hierarchy, finds all files and their total size.
   *
   * @param {File} gFile
   * @param {{ exclude: string[] }} props
   */
  static flatten(gFile, props) {
    /** @type {{ dest: File, destUri: string, relativePath: string }[]} */
    const files = [];

    const data = {
      files,
      totalSize: 0
    };

    /**
     * @param {any} x
     */
    const handleFile = x => {
      if (props.exclude.indexOf(x.gFile.get_basename()) !== -1) {
        return;
      }

      data.files.push(x);
      data.totalSize += x.gFileInfo.get_size();

      if (x.gFileInfo.get_file_type() === FileType.DIRECTORY) {
        this.children(gFile, x.gFile).forEach(handleFile);
      }
    };

    const relativePath = "";

    const file = {
      gFile,
      gFileInfo: gFile.query_info(
        "standard::*",
        FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
        null
      ),
      relativePath
    };

    handleFile(file);

    return data;
  }

  /**
   * For every child of a parent, gets Gio.File and Gio.FileInfo references
   * and a path relative to the given ancestor.
   *
   * @private
   * @param {File} ancestor
   * @param {File} parent
   */
  static children(ancestor, parent) {
    const enumerator = parent.enumerate_children(
      "standard::*",
      FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
      null
    );

    const files = [];

    while (true) {
      const gFileInfo = enumerator.next_file(null);

      if (!gFileInfo) {
        break;
      }

      const gFile = parent.get_child(gFileInfo.get_name());

      files.push({
        gFile,
        gFileInfo,
        relativePath: ancestor.get_relative_path(gFile)
      });
    }

    return files;
  }
}

exports.Flatten = Flatten;
