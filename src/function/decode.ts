import { ErrorType } from "@src/types"
import { AxiosResponse } from "axios"
import * as E from "fp-ts/Either"
import * as t from "io-ts"
import reporter from "io-ts-reporters"

export const decode = <I, D, A>(
    response: AxiosResponse<I, D>,
    url: string,
    decoder: t.Decoder<I, A>,
): E.Either<ErrorType, AxiosResponse<I, D>> => {
    const result = decoder.decode(response.data)
    if (E.isLeft(result)) {
        return E.left({
            type: "DecodeError",
            url,
            errors: reporter.report(result),
        })
    }

    return E.right(response as AxiosResponse<I, D>)
}
