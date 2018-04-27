const { test } = require("../Test/Test");
const { Bind } = require("./Bind");

test("auto binds prototype methods to instance", t => {
  class Button {
    constructor() {
      Bind.auto(this, __filename);
    }

    handleClick() {
      this.foo = "bar";
    }

    render() {
      return { onClick: this.handleClick };
    }
  }

  const btn = new Button();

  const virtualNode = btn.render();
  virtualNode.onClick();

  t.is(btn.foo, "bar");
});
