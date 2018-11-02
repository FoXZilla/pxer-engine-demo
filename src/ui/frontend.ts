import {PxerMixin, uuid} from "../common";
import {TaskInfo} from "../types";

export default class Frontend extends PxerMixin{
    formatUserInput(directiveName:string, payload:any) :TaskInfo {
        return this.createTask({
            name: directiveName,
            payload,
            callback: true,
        })
    }
    createTask( data: Partial<TaskInfo> ) :TaskInfo {
        return {
            name: '[[unnamed]]',
            payload: {},
            uuid: uuid(),
            dependOn: [],
            state: 'wait',
            callback: false,
            ...data,
        }
    }
}
