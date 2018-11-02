import {PxerMixin} from "../common";
import {ResolveResult, TaskInfo} from "../types";


/**
 * The Router has two responsibility:
 * 1. receive a task, assign to a Resolver
 * 2. called a callback when a task be resolved and task.callback is true
 * */
export default class Router extends PxerMixin{
    route(task:TaskInfo, callScheduler: (result:ResolveResult) => void){
        // route for the task which registered a callback
        const callback = (result:ResolveResult) => {
            callScheduler(result);
            if(task.callback){
                this.callbackMap[task.uuid](result, task);
                delete this.callbackMap[task.uuid];
            }
        };
        // snake case to hump case
        const key = task.name.replace(/[_\-]([a-z])/g, (matched, group1) => group1.toUpperCase());

        this.log(`route for "${key}"`,task);

        if(typeof (<any>this.sugar)[key] === 'function') {
            this.log(`to sugar::${key} with`, task);
            return (<any>this.sugar)[key](task, callback);
        }
        if(typeof (<any>this.base)[key] === 'function') {
            this.log(`to base::${key}`, task.payload);
            return (<any>this.base)[key](task.payload, callback);
        }

        throw TypeError(`illegal task ${task.name}`);
    }

    callbackMap:{
        [uuid:string]: Function
    } = {};
    /**
     * register a callback that it be called when the the task matched uuid be resolved
     * */
    register(uuid:string, callback:(...args:any[])=>any){
        this.callbackMap[uuid] = callback;
    };
}