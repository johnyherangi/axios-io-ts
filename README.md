<p align="center">
	<h1 align="center">axios-io-ts</h1>
	<p align="center">
        <a href="https://github.com/axios/axios">axios</a> with <a href="https://github.com/gcanti/io-ts">io-ts</a> validation.
  </p>
</p>
<p align="center">
  <a href="https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml">
  <img src="https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml/badge.svg" alt="npm version">
  </a>
  <a href="https://codecov.io/gh/johnyherangi/axios-io-ts">
  <img src="https://codecov.io/gh/johnyherangi/axios-io-ts/branch/master/graph/badge.svg" alt="License">
  </a>
</p>

<!-- Used for the "back to top" links within the document -->
<div id="contents"></div>

## Table of Contents

-   [Getting started](#getting-started)
-   [Features](#features)
    -   [Requests](#requests)
    -   [Data validation](#data-validation)
    -   [Error handling](#error-handling)

## Getting started

**NPM install**

```sh
npm install axios-io-ts
```

## Features

### Requests

HTTP request functions can be imported individually e.g.

```ts
import { httpPost } from "axios-io-ts"

const promise = httpPost({
    url: "/test",
    data: {
        foo: "bar",
    },
})
```

or by using the client factory e.g.

```ts
import { httpClient } from "axios-io-ts"

const client = httpClient({ baseURL: "baseURL" })
const promise = client.post({
    url: "/test",
    data: {
        foo: "bar",
    },
})
```

<sub>[⇧ back to top](#contents)</sub>

### Data validation

Provide an [io-ts](https://github.com/gcanti/io-ts) decoder to to your request to validate response data e.g.

```ts
import { httpGet } from "axios-io-ts"
import * as t from "io-ts"

const promise = httpGet({
    url: "/test",
    decoder: t.type({
        foo: t.string,
    }),
}).then((response) => response.data.foo)
```

<sub>[⇧ back to top](#contents)</sub>

### Error handling

If response data validation fails, a `DecodeError` is thrown. You can catch this with `onDecodeError()` e.g.

```ts
import { httpGet, onDecodeError } from "axios-io-ts"
import * as t from "io-ts"

const promise = httpGet({
    url: "/test",
    decoder: t.type({
        foo: t.string,
    }),
})
    .then((response) => response.data.foo)
    .catch(onDecodeError((err) => handle(err)))
    .catch((other) => null)
```

<sub>[⇧ back to top](#contents)</sub>
