import axios from "axios"
import * as t from "io-ts"
import { httpRequest } from "src"

describe("request.ts", () => {
    describe("httpRequest()", () => {
        it("decodes successful response", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue({
                status: 200,
                data: {
                    a: "test",
                },
            })

            const result = await httpRequest({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalled()
        })

        it("throws if response data cannot be decoded", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue({
                status: 200,
                data: undefined,
            })

            expect(
                async () =>
                    await httpRequest({
                        url: "/test",
                        decoder: t.type({ a: t.string }),
                    }),
            ).rejects.toThrow()
            expect(axiosSpy).toBeCalled()
        })
    })
})
