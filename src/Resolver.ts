import {Directive, PxerTask, GetMemberWorksPayload, GetWorkInfoPayload, ProcessWorkListPayload, TaskResultCode, TaskResult, GetUgoiraMetaPayload, Work} from "./types"
import PixivAPI from "./PixivAPI"
import {NumberToWorkType} from "./Work";
import { worker } from "cluster";

class BaseResolver {
    static async GetMemberWorks(task: PxerTask): Promise<PxerTask[]> {
        if (task.Directive!=Directive.GetMemberWorks) {
            throw new Error("Directive type mismatch")
        }
        let payload = <GetMemberWorksPayload>task.Payload
        let res = await PixivAPI.MemberWorks(payload.UserID)
        
        task.Results = <TaskResult>{
            Error: {
                ErrCode: TaskResultCode.OK,
                TaskID: task.ID,
            },
            Works: [],
        }
        
        return [{
            Directive: Directive.ProcessWorkList,
            Options: task.Options,
            Payload: <ProcessWorkListPayload>{
                Works: res.map(r=>{return {ID: r.ID}}),
            },
            Results: null,
            Triggers: [],
            ID: -1,
        }]
    }
    static async GetWorkInfo(task: PxerTask): Promise<PxerTask[]> {
        if (task.Directive!=Directive.GetWorkInfo) {
            throw new Error("Directive type mismatch")
        }
        let payload = <GetWorkInfoPayload>task.Payload;
        let res = await PixivAPI.WorkInfoBasic(payload.WorkID);
        let type = NumberToWorkType(res.illustType);
        let work: Work = {
            ID: res.illustId,
            Type: type,
            URLs: res.urls,
        }

        task.Results = <TaskResult>{
            Error: {
                ErrCode: TaskResultCode.OK,
                TaskID: task.ID,
            },
            Works: [],
        }

        if (task.Options.IncludeUgoiraMeta && type == "ugoira") {
            return [{
                Directive: Directive.GetUgoiraMeta,
                Options: task.Options,
                Payload: <GetUgoiraMetaPayload>{
                    PartiallyFilledWork: work,
                },
                Results: null,
                Triggers: [],
                ID: -1,
            }]
        }
        task.Results.Works.push(work);
        return []
    }
    static async GetUgoiraMeta(task: PxerTask) :Promise<PxerTask[]> {
        if (task.Directive!=Directive.GetUgoiraMeta) {
            throw new Error("Directive type mismatch")
        }
        let payload = <GetUgoiraMetaPayload>task.Payload
        let work = payload.PartiallyFilledWork;
        let meta = await PixivAPI.UgoiraMeta(work.ID)
        work.UgoiraMeta = meta
        task.Results = <TaskResult>{
            Error: {
                ErrCode: TaskResultCode.OK,
                TaskID: task.ID,
            },
            Works: [work],
        }
        return []
    }
}

class SugarResolver {
    static async ProcessWorksList(task: PxerTask): Promise<PxerTask[]> {
        if (task.Directive!=Directive.ProcessWorkList) {
            throw new Error("Directive type mismatch")
        }
        let payload = <ProcessWorkListPayload>task.Payload
        let tasks: PxerTask[] = [];
        for (let work of payload.Works) {
            if ((work.Type) && !(work.Type in task.Options.WantedTypes)) {
                continue
            }
            tasks.push({
                Directive: Directive.GetWorkInfo,
                Options: task.Options,
                Payload: <GetWorkInfoPayload>{
                    WorkID: work.ID,
                    //AppendTaskIfUgoira: true,
                },
                Results: null,
                Triggers: [],
                ID: -1,
            })
        }
        task.Results = <TaskResult>{
            Error: {
                ErrCode: TaskResultCode.OK,
                TaskID: task.ID,
            },
            Works: [],
        }
        return tasks
    }
}

export { BaseResolver, SugarResolver}