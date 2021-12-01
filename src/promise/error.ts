import { DecodeError } from "../types"

export const isDecodeError = (error: unknown): error is DecodeError => {
    return (error as DecodeError).url !== undefined && (error as DecodeError).errors !== undefined
}

export const onDecodeError = <R>(fn: (error: DecodeError) => R) => {
    return (error: unknown): R => {
        if (isDecodeError(error)) {
            return fn(error)
        }
        throw error
    }
}
