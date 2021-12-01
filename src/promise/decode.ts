import * as E from "fp-ts/Either"
import * as t from "io-ts"
import reporter from "io-ts-reporters"

export const decode = <I, A>(data: I, url: string, decoder: t.Decoder<I, A>): void => {
    const result = decoder.decode(data)
    if (E.isLeft(result)) {
        throw {
            url,
            errors: reporter.report(result),
        }
    }
}
