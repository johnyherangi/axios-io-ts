import { onDecodeError } from "@src/typeGuards"

describe("typeGuards.ts", () => {
    describe("onDecodeError", () => {
        it("captures a DecodeError", async () => {
            const result = await Promise.reject({ url: "/test", errors: ["test error"] }).catch(
                onDecodeError(() => "decode error"),
            )
            expect(result).toMatchSnapshot()
        })
        it("rethrows an unknown error", async () => {
            const result = await Promise.reject("unknown error")
                .catch(onDecodeError(() => "decode error"))
                .catch((err) => err)
            expect(result).toMatchSnapshot()
        })
    })
})
