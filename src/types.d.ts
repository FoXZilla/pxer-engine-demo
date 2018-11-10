export interface Work {
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

export interface UgoiraMeta {
    src: string,
    originalSrc: string,
    mime_type: string,
    frames: {
        file: string,
        delay: number,
    }[]
}

export type WorkType = "manga"|"illust"|"ugoira"

export const enum Directive {
    GetMemberWorks = 1,
    GetWorkInfo = 2,
    GetUgoiraMeta = 3,

    // Sugar start from 100
    ProcessWorkList = 101,
}

export type TaskID = number;

export const enum TaskResultCode {
    OK = 0,
    NetworkError = 300,
    AccountRestriction = 400,
    ParseError = 500,
}

export interface PxerDirective {
    Directive: Directive,
    Payload: DirectivePayload,
    Options: DirectiveOptions,
}

export interface DirectivePayload {}

export interface GetMemberWorksPayload extends DirectivePayload {
    UserID: string,
}

export interface GetWorkInfoPayload extends DirectivePayload {
    WorkID: string,
    //AppendTaskIfUgoira: boolean,
}

interface GetUgoiraMetaPayload extends DirectivePayload {
    PartiallyFilledWork: Work,
}

interface ProcessWorkListPayload extends DirectivePayload {
    Works: {
        ID: string,
        Type?: WorkType,
    }[],
}

interface DirectiveOptions {
    WantedTypes: WorkType[],
    IncludeUgoiraMeta: boolean,
    IncludeDetailedWorkInfo: boolean,
    EnableDebug: boolean,
}

interface PxerTask extends PxerDirective{
    Results: null|TaskResult,
    ID: TaskID,
}

interface TaskResult {
    Error: TaskError,
    Works: Work[],
}

interface TaskError {
    ErrCode: TaskResultCode,
    TaskID: TaskID,
    Msg?: string,
}