# axios-io-ts

[![ci](https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/johnyherangi/axios-io-ts/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/johnyherangi/axios-io-ts/branch/master/graph/badge.svg)](https://codecov.io/gh/johnyherangi/axios-io-ts)

A simple wrapper for [axios](https://github.com/axios/axios) with [io-ts](https://github.com/gcanti/io-ts) validation.

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

## Error handling

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
