#!/bin/bash
# Runs tests and writes an HTML coverage report.

gunit="$(dirname "$(realpath "$0")")"/..
your="$(pwd)"

rm -rf "$your"/coverage

if [ -z "$GJS_COVERAGE_PREFIXES" ]; then
  GJS_COVERAGE_PREFIXES="$your"/src
fi

# Gjs coverage uses absolute paths.
NODE_ENV=development gjs \
  --coverage-prefix="$GJS_COVERAGE_PREFIXES" \
  --coverage-output="$your"/coverage \
  "$gunit"/bin/test.js "$@" &&

genhtml -o "$your"/coverage "$your"/coverage/coverage.lcov
