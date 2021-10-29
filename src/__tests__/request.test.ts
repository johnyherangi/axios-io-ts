import {
    httpDelete,
    httpGet,
    httpOptions,
    httpPatch,
    httpPost,
    httpPut,
    httpRequest,
} from "@src/request"
import axios from "axios"
import * as t from "io-ts"
import { axiosResponse } from "./__fixtures__/axios.fixture"

describe("request.ts", () => {
    describe("httpRequest()", () => {
        it("decodes successful response", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpRequest({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalled()
        })

        it("throws if response data cannot be decoded", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const error = await httpRequest({
                url: "/test",
                decoder: t.type({ a: t.number }),
            }).catch((error) => error)

            expect(error).toMatchSnapshot()
            expect(axiosSpy).toBeCalled()
        })
    })
    describe("httpDelete()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpDelete({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "DELETE",
                }),
            )
        })
    })
    describe("httpGet()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpGet({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "GET",
                }),
            )
        })
    })
    describe("httpOptions()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpOptions({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "OPTIONS",
                }),
            )
        })
    })
    describe("httpPatch()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpPatch({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "PATCH",
                }),
            )
        })
    })
    describe("httpPost()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpPost({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "POST",
                }),
            )
        })
    })
    describe("httpPut()", () => {
        it("sends correct HTTP method", async () => {
            const axiosSpy = jest.spyOn(axios, "request").mockResolvedValue(axiosResponse)

            const result = await httpPut({
                url: "/test",
                decoder: t.type({ a: t.string }),
            })
            expect(result.data.a).toEqual("test")
            expect(axiosSpy).toBeCalledWith(
                expect.objectContaining({
                    method: "PUT",
                }),
            )
        })
    })
})
