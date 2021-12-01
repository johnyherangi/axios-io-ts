import { httpClient } from "@src/promise/client"
import axios from "axios"
import * as t from "io-ts"
import { axiosResponse } from "./__fixtures__/axios.fixture"

describe("client.ts", () => {
    it("sends HTTP DELETE request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).delete({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "DELETE",
                url: "/test",
            }),
        )
    })
    it("sends HTTP GET request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).get({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "GET",
                url: "/test",
            }),
        )
    })
    it("sends HTTP HEAD request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).head({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "HEAD",
                url: "/test",
            }),
        )
    })
    it("sends HTTP OPTIONS request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).options({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "OPTIONS",
                url: "/test",
            }),
        )
    })
    it("sends HTTP PATCH request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).patch({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "PATCH",
                url: "/test",
            }),
        )
    })
    it("sends HTTP POST request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).post({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })

        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "POST",
                url: "/test",
            }),
        )
    })
    it("sends HTTP PUT request", async () => {
        const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

        const result = await httpClient({
            baseURL: "baseURL",
        }).put({
            url: "/test",
            decoder: t.type({ a: t.string }),
        })
        expect(result.data.a).toEqual("test")
        expect(axiosSpy).toBeCalledWith(
            expect.objectContaining({
                baseURL: "baseURL",
                method: "PUT",
                url: "/test",
            }),
        )
    })
})
