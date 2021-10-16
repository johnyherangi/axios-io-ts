import { helloWorld } from "../src/index"

describe("helloWorld() tests", () => {
    it("prints 'Hello, World!'", () => {
        expect(helloWorld()).toEqual("Hello, World!")
    })
})
