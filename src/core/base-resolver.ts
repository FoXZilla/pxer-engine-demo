import {baseResolvedRequest, createResult, inBrowser, PxerMixin, toQueryString} from "../common";
import {RequestCallback} from "request";
import {Errcode, ResolveResult} from "../types";
import {URLSearchParams} from "url";

const Request = inBrowser && require('request');

export default class BaseResolver extends PxerMixin{

    getUserProfile({userId}:{userId:string}, callback:(result:ResolveResult)=>void){
        baseResolvedRequest({
            method: 'GET',
            url: `https://www.pixiv.net/ajax/user/${userId}/profile/all`,
            callback,
            log: this.log.bind(this),
        });
    };

    static getUserIllustsDataIdsMaxLength = 75;
    getUserIllustsData({userId,ids}:{userId:string,ids:string[]}, callback:(result:ResolveResult)=>void){
        baseResolvedRequest({
            method: 'GET',
            url: `https://www.pixiv.net/ajax/user/${userId}/illusts?${toQueryString({ids})}`,
            callback,
            log: this.log.bind(this),
        });
    };
}
