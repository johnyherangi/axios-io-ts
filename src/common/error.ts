import { ErrorType } from "@src/types"
import axios from "axios"

export const toErrorType = (error: unknown): ErrorType => {
    if (axios.isCancel(error)) {
        return {
            type: "CancelRequestError",
        }
    }

    if (axios.isAxiosError(error)) {
        if (error.response) {
            return {
                type: "ResponseError",
                response: error.response,
            }
        }

        if (error.request) {
            return {
                type: "RequestError",
                request: error.request,
            }
        }
    }

    return {
        type: "UnknownError",
        error,
    }
}
