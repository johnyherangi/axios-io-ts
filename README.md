<p align="center">
	<h1 align="center">axios-io-ts</h1>
	<p align="center">
        <a href="https://github.com/axios/axios">Axios</a> with <a href="https://github.com/gcanti/io-ts">io-ts</a> validation.
  </p>
</p>
<p align="center">
  <a href="https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml">
  <img src="https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml/badge.svg" alt="ci status">
  </a>
  <a href="https://codecov.io/gh/johnyherangi/axios-io-ts">
  <img src="https://codecov.io/gh/johnyherangi/axios-io-ts/branch/master/graph/badge.svg" alt="codecov status">
  </a>
  <a href="https://www.npmjs.com/axios-io-ts">
  <img src="https://img.shields.io/npm/v/axios-io-ts" alt="npm version">
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

as part of the default export e.g.

```ts
import axios from "axios-io-ts"

const promise = axios.get({
    url: "/test",
    data: {
        foo: "bar",
    },
})
```

or, with the client factory e.g.

```ts
import { httpClient } from "axios-io-ts"

const client = httpClient({ baseURL: "baseURL" }) // OR axios.create({ baseURL: "baseURL" })
const promise = client.post({
    url: "/test",
    data: {
        foo: "bar",
    },
})
```

<sub>[⇧ back to top](#contents)</sub>

### Data validation

Axios response data can be validated by providing an [io-ts](https://github.com/gcanti/io-ts) decoder to to your request

```ts
import { httpGet } from "axios-io-ts"
import * as t from "io-ts"

const promise = httpGet({
    url: "/test",
    decoder: t.type({
        foo: t.string,
    }),
}).then((response) => response.data.foo) // strongly typed foo
```

<sub>[⇧ back to top](#contents)</sub>

### Error handling

If data validation fails, a `DecodeError` is thrown. You can catch this with `onDecodeError()`

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
