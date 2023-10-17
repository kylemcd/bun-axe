# bun-axe
> Run axe a11y tests in your bun project

### Install
```
bun add bun-axe
```

### Usage

> Note: Bun currently does not support `extend.expect`, so this API will be changed once it's supported. This example code is based on [this workaround](https://github.com/oven-sh/bun/issues/3621#issuecomment-1732130865).

```
import { describe, it, expect } from 'bun:test'
import { axe, toHaveNoViolationsFn } from 'bun-axe'

describe("Test", () => {
  it("should pass a11y test", async () => {
    document.body.innerHTML = `<button>My button</button>`;
    const button = document.querySelector('button');

    expect(toHaveNoViolationsFn(await axe(button)).pass).toBe(true);
  });
})
```

If you run into an a11y violation, `console.log(toHaveNoViolationsFn(await axe(button)).actual)` can be used to see the violations. Until bun supports `extend.expect` there is no other great way to get this currently.

### Future
Once bun supports `extend.expect` you can swap `toHaveNoViolationsFn` for `toHaveNoViolations` and test like this:


```
import { describe, it, expect } from 'bun:test'
import { axe, toHaveNoViolationsFn } from 'bun-axe'

describe("Test", () => {
  it("should pass a11y test", async () => {
    document.body.innerHTML = `<button>My button</button>`;
    const button = document.querySelector('button');

    expect(await axe(button)).toHaveNoViolations()
  });
})
```


