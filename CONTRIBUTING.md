# Contributing

Get started with [npm](https://nodejs.org/en/download/):

```bash
# clone repo
git clone https://github.com/makepost/gunit
cd gunit

# install dependencies
npm install

# lint all JS files in `bin` and `gunit-src`
npm run format

# run tests and see coverage
npm run coverage && xdg-open coverage/index.html
```

[VS Code](https://code.visualstudio.com/) will highlight mistakes and provide autocomplete, as long as you follow JSDoc [@param](http://usejsdoc.org/tags-param.html) and [@type](http://usejsdoc.org/tags-type.html).