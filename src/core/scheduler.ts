import {isSuccessErrcode, PxerMixin} from "../common";
import {Errcode, ResolveResult, TaskInfo} from "../types";


export default class Scheduler extends PxerMixin{
    taskMap:{ [uuid:string] :TaskInfo } = {};

    /**
     * exec a task(s)
     * */
    push(...tasks:TaskInfo[]){
        for(let task of tasks){
            this.log(`push <${task.name}>`, task);
            this.taskMap[task.uuid] = task;

            if(task.dependOn.length){
                this.startLoop();
            }else{
                this.exec(task);
            }
        }
    }

    private exec(task:TaskInfo){
        this.log(`exec <${task.name}>`, task);
        task.state = 'pending';
        this.router.route(task, (result:ResolveResult) => {
            if(task.state !== 'pending') return;//todo: add debug info
            task.result = result;
            task.state = isSuccessErrcode(result.errcode)
                ? 'fulfilled'
                : 'rejected'
            ;
            this.startLoop();
        });
    }

    private checked = false;
    private startLoop(){
        this.checked = false;
        Promise.resolve().then(()=>{
            if(this.checked)return;
            this.checked = true;
            this.checkMap();
        });
    }

    private checkMap(){
        for(let task of Object.values(this.taskMap)){
            // invoke the task when all of task it depend on is be fulfilled
            // or one of task be rejected
            if(task.state === 'wait' && task.dependOn.length){
                if(
                    task.dependOn.every(uuid => this.taskMap[uuid].state === 'fulfilled')
                    || task.dependOn.some(uuid => this.taskMap[uuid].state === 'rejected')
                ){
                    task.dependOnTask = task.dependOn.map(uuid => this.taskMap[uuid]);
                    task.dependOn.forEach(uuid => delete this.taskMap[uuid]);
                    this.exec(task);
                }
            }
        }
    }
    private clearMap(){
        const newMap:{[k:string]:TaskInfo} = {};
        for(let task of Object.values(this.taskMap)){
            if(['wait','pending'].includes(task.state) || this.beDepended(task.uuid)){
                newMap[task.uuid] = task;
            }
        }
        this.taskMap = newMap;
    }

    private beDepended(uuid:string){
        return Object.values(this.taskMap).some(task => task.dependOn.includes(uuid));
    }
}
