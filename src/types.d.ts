import {Flags} from "./core/sugar-resolver";

export interface ResolveResult {
    errcode: number,
    errmsg: string | string[],
}
export const enum Errcode {
    Error = 3,
    Ok = 1,

    NetworkError = 300,
    PixivReturnedError = 301,
}
export type SuccessErrcode = number;
export type ErrorErrcode = number;

export interface TaskInfo {
    name: string;
    payload: object;
    callback: boolean;
    uuid: string;
    dependOn: string[];
    dependOnTask?: TaskInfo[]; // be loaded when they all be fulfilled
    state: 'wait'|'pending'|'fulfilled'|'rejected';
    flag?: Flags;
    result?: ResolveResult & { [p:string] :any }; // be loaded when be resolved
}

export type TransferFlog = symbol;
