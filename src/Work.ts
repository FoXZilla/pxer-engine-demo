import {WorkType} from "./types"

function NumberToWorkType(type: number|string): WorkType {
    switch (type.toString()) {
    case "0":
        return "illust"
    case "1":
        return "manga"
    case "2":
        return "ugoira"
    }
    throw new Error("Unknown work type")
}

export {NumberToWorkType}