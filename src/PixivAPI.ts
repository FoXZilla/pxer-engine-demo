import request from "request"
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
//** Raw Pixiv API encapsulation */
class PixivAPI {
    
    /** Network Request
     *  TODO: Add browser support
     */
    private static get(url: string): Promise<string> {
        return new Promise((resolve, reject)=>{
            request({
                method: "GET",
                url: url,
                headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:62.0) Gecko/20100101 Firefox/62.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
                'Cookie': `PHPSESSID=${(<any>global).PHPSESSID}`,
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
                'TE': 'Trailers',
                },
            }, function(err, resp, body) {
                if (err) {
                    reject(err);
                } else {
                    if ([200,304].indexOf(resp.statusCode)==-1) {
                        reject(new Error(`Remote returned ${resp.statusCode}: ${resp.statusMessage}`))
                    }
                    resolve(body.toString())
                }
            })
        })
    }
    
    /**
     * Acquire all works by a user
     * @param id userID
     */
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
    /**
     * Acquire basic work info
     * @param id il;ustID
     */
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
    /**
     * Acquire ugoira meta
     * @param id illustID
     */
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