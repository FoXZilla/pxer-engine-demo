import * as https from "https"
import { URL } from "url";
import { Buffer } from "buffer";
import {UgoiraMeta} from "./types"

interface MemberWorksResponse {
    ID: string,
    Type: "illusts"|"manga",
}

interface WorkBasicInfoResponse {
    illustId: string,
    illustTitle: string,
    illustComment: string,
    id: string,
    title: string,
    description: string,
    illustType: number,
    createDate: string,
    uploadDate: string,
    restrict: number,
    xRestrict: number,
    urls: {
        mini: string,
        thumb: string,
        small: string,
        regular: string,
        original: string,
    },
    tags: {
        authorId: string,
        isLocked: boolean,
        tags: {
            tag: string,
            locked: boolean,
            deletable: boolean,
            userId: string,
            romaji: string,
            translation?: {
                [lang: string]: string,
            }
            userName:string,
        }[],
        writable: boolean,
    }
    storableTags: string[],
    userId: string,
    userName:string,
    userAccount: string,
    userIllusts: {
        [id: string]: null|{
            illustId: string,
            illustTitle: string,
            id: string,
            title: string,
            illustType: number,
            xRestrict: number,
            restrict: number,
            url: string, // thumb
            tags: string[],
            userId: string,
            width: number,
            height: number,
            pageCount: number,
            isBookmarkable: boolean,
            bookmarkData: null|{
                id: string,
                private: boolean,
            }
        },
    }
}

class PixivAPI {
    private static get(url: string): Promise<string> {
        return new Promise((resolve, reject)=>{
            let data = Buffer.from("")
            let target = new URL(url);
            let req = https.request({
                host: target.host,
                path: target.href + target.search,
                headers: {
                    "Cookie": `PHPSESSID=${(<any>global).PHPSESSID}`,
                }
            }, (res)=>{
                res.on("data", (chunk)=>{
                    data += chunk;
                })
                res.on("end", ()=>resolve(data.toString()))
                res.on("error", (err)=>reject(err))
            })
            req.end();
        })
    }
    public static async MemberWorks(id: string): Promise<MemberWorksResponse[]> {
        let url = `https://www.pixiv.net/ajax/user/${id}/profile/all`
        let res = await this.get(url)
        let data: any = JSON.parse(res)
        if (data.error) {
            throw new Error(data.message)
        }
        let works: MemberWorksResponse[] = [];
        for (let illust in data.body.illusts) {
            works.push({
                ID: illust,
                Type: "illusts",
            })
        }
        for (let manga in data.body.manga) {
            works.push({
                ID: manga,
                Type: "manga",
            })
        }
        return works
    }
    public static async WorkInfoBasic(id: string): Promise<WorkBasicInfoResponse> {
        let url = `https://www.pixiv.net/ajax/illust/${id}`
        let res = await this.get(url)
        let data: any = JSON.parse(res)
        if (data.error) {
            throw new Error(data.message)
        }
        let info: WorkBasicInfoResponse = data.body;
        return info
    }
    public static async UgoiraMeta(id: string): Promise<UgoiraMeta> {
        let url = `https://www.pixiv.net/ajax/illust/${id}/ugoira_meta`
        let res = await this.get(url);
        let data: any = JSON.parse(res)
        if (data.error) {
            throw new Error(data.message)
        }
        let meta: UgoiraMeta = data.body;
        return meta
    }
}

export default PixivAPI