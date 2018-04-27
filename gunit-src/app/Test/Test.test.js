const { test } = require("./Test");

test("passes after awaiting promise", async t => {
  await Promise.resolve();

  t.pass();
});

test("compares values", t => {
  t.is(1 + 1, 2);
});
