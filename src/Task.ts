import {Work, WorkType} from "./Work"

enum Directive {
    GetMemberWorks = 1,
    GetWorkInfo = 2,
    GetUgoiraMeta = 3,

    // Sugar start from 100
    ProcessWorkList = 101,
}

type TaskID = number;

enum TaskResultCode {
    OK = 0,
    NetworkError = 300,
    AccountRestriction = 400,
    ParseError = 500,
}

interface PxerDirective {
    Directive: Directive,
    Payload: DirectivePayload,
    Options: DirectiveOptions,
}

interface DirectivePayload {}

interface GetMemberWorksPayload extends DirectivePayload {
    UserID: string,
}

interface GetWorkInfoPayload extends DirectivePayload {
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
    Triggers: TaskID[],
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

export {Directive, TaskID, TaskResultCode, PxerDirective, DirectivePayload, PxerTask, TaskResult, GetMemberWorksPayload, ProcessWorkListPayload, GetWorkInfoPayload,GetUgoiraMetaPayload, TaskError}