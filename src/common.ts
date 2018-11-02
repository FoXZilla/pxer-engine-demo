import {BaseResolved, PxerEngine, Frontend, Router, Scheduler, SugarResolved} from "./index";
import {Errcode, ErrorErrcode, ResolveResult, SuccessErrcode, TransferFlog} from "./types";
import {RequestCallback} from "request";

export class PxerMixin{
    engine: PxerEngine = null as any;

    frontend: Frontend = null as any;

    scheduler: Scheduler = null as any;
    router: Router = null as any;
    sugar: SugarResolved = null as any;
    base: BaseResolved = null as any;


    log: (...messages:any[]) => void = null as any;
}

// @ts-ignore
export const inBrowser = typeof window !== 'undefined';

export function createResult(error:Error):ResolveResult;
export function createResult(errcode:Errcode, errmsg:string|string[]):ResolveResult;
export function createResult(data:object):ResolveResult;
export function createResult(...args: any[]):ResolveResult{
    if(args[0] instanceof Error){
        return {
            errcode: Errcode.Error,
            errmsg: ['error',args[0].message],//todo: i18n here
        }
    } else if (typeof args[0] === 'number') {
        return {
            errcode: args[0],
            errmsg: args[1] || 'error',
        }
    } else if (typeof args[0] === 'object') {
        return {
            errcode: Errcode.Ok,
            errmsg: 'ok',
            ...args[0],
        }
    } else {
        return {
            errcode: Errcode.Ok,
            errmsg: 'ok',
        }
    }

}

export function baseResolvedRequest(
    {method,url,callback,log}
    :{
        method:string,
        url:string,
        callback:(result:ResolveResult)=>void,
        log:(...messages:any[])=>void,
    }
){
    if(inBrowser){
        //todo
        throw new Error('Browser is unsupported');
    } else {
        const Request = require('request');
        log(`request ${url}`);
        Request({
            method,
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:62.0) Gecko/20100101 Firefox/62.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
                'Cookie': process.env.cookie || process.env.COOKIE,
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
                'TE': 'Trailers',
            },
            gzip: true,
        }, function(error, response, body) {
            if(error) return callback(createResult(error));
            if(typeof body === 'string') {
                try{
                    body = JSON.parse(body);
                }catch (e) {

                }
            }

            if(![200,304].includes(response.statusCode)){
                return callback(createResult(
                    Errcode.NetworkError,
                    [`http code is ${response.statusCode}`,body]
                ));
            }
            if(
                'content-type' in response.headers
                && response.headers['content-type']!.startsWith('application/json')
            ){
                const pixivResponse:any = body;
                if(pixivResponse.error){
                    return callback(createResult(
                        Errcode.PixivReturnedError,
                        [pixivResponse.message, body],
                    ));
                }
                return callback(createResult(pixivResponse));
            }

            callback(createResult({
                body,
            }));
        } as RequestCallback);
    }
}

// @ts-ignore
// https://stackoverflow.com/questions/1714786/query-string-encoding-of-a-javascript-object
export function toQueryString(obj, prefix='') {
    var str = [],
        p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            var k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];
            str.push((v !== null && typeof v === "object") ?
                toQueryString(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
}

export function isSuccessErrcode(errcode:Errcode):errcode is SuccessErrcode {
    return errcode.toString()[0] === '1';
}
export function isErrorErrcode(errcode:Errcode):errcode is ErrorErrcode {
    return errcode.toString()[0] === '3';
}

export function uuid():string {
    return new Date().getTime().toString(36) + Number(Math.random().toString().split('.')[1]!).toString(36);
}
