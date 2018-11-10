import {Directive, PxerTask, GetMemberWorksPayload, GetWorkInfoPayload, ProcessWorkListPayload, TaskResultCode, TaskResult, GetUgoiraMetaPayload, Work} from "./types"
import PixivAPI from "./PixivAPI"
import {NumberToWorkType} from "./Work";

/*
    Resolver Layers:
        3 :[Sugar only]Paging
        2 :Acquire work list
        1 :[process_work_list only] perform filtering and batching before moving on to fetch work metadata
        0 :Resolve work metadata
        -1:Resolve ugoira metadata
    
    Resolver Workflow:
        0 :Check whether the given task is of the right type
        1 :Parse work payload and perform tasks
        2 :Fill in task.Results (whether there is an error && result work list(layer<=0 only otherwise return []) )
        3 :Return subtasks of at the same or a lower layer

    Rules for Resolvers:
        0 :Do NOT skip over layer 1. Resolvers at layer > 1 should only return subtasks of layer>=1.
        1 :Do not return subtasks of a higher layer and avoid returning subtasks of the same layer.
*/

class BaseResolver {
    /**
     * Get all works by a single user
     * Layer: 2
     * @param task raw Task
     */
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
            ID: -1,
        }]
    }

    /**
     * Get metadata of a single work
     * Layer: 0
     * @param task raw task
     */
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
                ID: -1,
            }]
        }
        task.Results.Works.push(work);
        return []
    }

    /**
     * Get ugoira meta data
     * Layer: -1
     * @param task raw task
     */
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
    /**
     * Perform filtering
     * Layer: 1
     * @param task raw task
     */
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