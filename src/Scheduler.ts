import {PxerTask,PxerDirective, Work, TaskError, TaskResultCode} from "./types"
import Router from "./Router"
import WaitGroup from "./WaitGroup"

class PxerScheduler {
    private TaskList: PxerTask[]
    private wg: WaitGroup
    private debug: boolean
    constructor(){
        this.TaskList = []
        this.wg = new WaitGroup
        this.debug = false
    }
    public static load(state: string) :PxerScheduler {
        return Object.assign(new PxerScheduler, JSON.parse(state))
    }
    public init(req: PxerDirective) :boolean {
        this.debug = req.Options.EnableDebug;
        let task: PxerTask = {
            ...req,
            Results: null,
            ID: 0,
        };
        this.TaskList[0] = task

        return true
    }
    
    public run() :Promise<void> {
        this.wg = new WaitGroup;
        let pendingIDs = []
        for (let i=0; i<this.TaskList.length; i++) {
            if (this.TaskList[i].Results == null) {
                pendingIDs.push(i)
            }
        }
        for (let id of pendingIDs) {
            this._exec(id);
        }
        if (this.debug) {
            let int = setInterval(()=>console.log(`${this.wg.getCount()} processes in wait group.`), 1000)
            this.wg.wait().then(()=>{
                clearInterval(int)
            })
        }
        return this.wg.wait()
    }

    public getProgress(): [number, number] {
        return [this.TaskList.length- this.wg.getCount(), this.TaskList.length]
    }
    
    public collect(): [Work[], TaskError[]] {
        let works: Work[] = [];
        let errors: TaskError[] = [];
        for (let task of this.TaskList) {
            if (task.Results!=null) {
                works.push(...task.Results.Works)
                if (task.Results.Error.ErrCode!==TaskResultCode.OK) {
                    errors.push(task.Results.Error);
                }
            }
        }
        return [works, errors]
    }
    public save(): string {
        return JSON.stringify(this)
    }
    private appendTask(task: PxerTask) :number {
        return this.TaskList.push(task)-1
    }
    private _exec(id: number): void {
        let task = this.TaskList[id];
        if (this.debug) {
            console.log(`PxerScheduler: scheduling task ${id} of type ${task.Directive}`)
        }
        this.wg.add();
        let done = ()=>this.wg.done();
        Router.Exec(task).then(works=>{
            if (!(task.Results)) {
                console.error(`task ${task.ID} failed to fill its result`)
            }
            for (let work of works) {
                let id = this.appendTask(work);
                work.ID = id;
                if (this.debug) {
                    console.log(`PxerScheduler: pushing task ${id}`)
                }
                this._exec(id);
            }
            done();
        }).catch(e=>{
            console.error(`An error occured while handling task ${id}: ${e.toString()}`)
            if (this.debug && e instanceof Error) {
                console.log(e.stack)
            }
            done();
        })
    }
}

export default PxerScheduler