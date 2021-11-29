import { decode } from "@src/decode"
import * as t from "io-ts"

describe("decode.ts", () => {
    describe("decode()", () => {
        it("decodes data", () => {
            decode({ a: "test" }, "test", t.type({ a: t.string }))
        })
        it("throws if decode fails", () => {
            expect(() => decode({ a: "test" }, "test", t.type({ a: t.number }))).toThrowError()
        })
    })
})
