import { describe, it } from "mocha"
import { expect } from "chai"
import { helloWorld } from "../src/index"

describe("helloWorld() tests", () => {
    it("prints 'Hello, World!'", () => {
        expect(helloWorld()).to.equal("Hello, World!")
    })
})
