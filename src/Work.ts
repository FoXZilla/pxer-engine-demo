

interface Work {
    ID: string,
    Type: WorkType,
    URLs: {
        mini: string,
        thumb: string,
        small: string,
        regular: string,
        original: string,
    }
    UgoiraMeta?:UgoiraMeta,
}

interface UgoiraMeta {
    src: string,
    originalSrc: string,
    mime_type: string,
    frames: {
        file: string,
        delay: number,
    }[]
}

type WorkType = "manga"|"illust"|"ugoira"

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

export {Work, WorkType, NumberToWorkType, UgoiraMeta}