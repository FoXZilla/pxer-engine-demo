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
    /**
     * Resume from a saved progress
     * @param state progess save data
     */
    public resume(state: string) :Promise<void> {
        Object.assign(this, JSON.parse(state))
        return this._run();
    }
    /**
     * Serialize current progress
     */
    public save(): string {
        return JSON.stringify(this)
    }
    /**
     * Start the task
     * @param req initial directive
     */
    public do(req: PxerDirective) :Promise<void> {
        this.debug = req.Options.EnableDebug;
        let task: PxerTask = {
            ...req,
            Results: null,
            ID: 0,
        };
        this.TaskList[0] = task
        return this._run()
    }
    /**
     * Start the flow
     */
    private _run() :Promise<void> {
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

    /**
     * Calculate current progress by returning completed tasks and task list length
     */
    public getProgress(): [number, number] {
        return [this.TaskList.length - this.wg.getCount(), this.TaskList.length]
    }
    /**
     * Scan all completed tasks and aggregate work results
     */
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
    
    /**
     * add a task to the workerpool
     * @param task the new task to add to the workerpool
     */
    private appendTask(task: PxerTask) :number {
        return this.TaskList.push(task)-1
    }
    
    /**
     * execute new task
     * Flow:
     * 0: Check task validity
     * 1: increment WaitGroup
     * 2: Execute task
     * 3: Append subtasks
     * 4: decrement WaitGroup
     * @param id task id
     */
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