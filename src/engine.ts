import {PxerMixin} from "./common";
import {BaseResolved, Router, Scheduler, SugarResolved, Frontend} from "./index";
import {ResolveResult, TaskInfo} from "./types";

export default class PxerEngine extends PxerMixin{
    constructor() {
        super();
        // mixin in all components which be mixined
        const mixins:PxerMixin = {
            engine: this,
            frontend: new Frontend,
            scheduler: new Scheduler,
            router: new Router,
            base: new BaseResolved,
            sugar: new SugarResolved,
            log(...messages:any[]){
                console.log('LOG >>',this.constructor.name,'#', ...messages);
            },
        };
        Object.values(mixins).forEach(comp => Object.assign(comp, mixins));

    }
    exec(directiveName:string, payload:any, callback:(data:ResolveResult & {data: any})=>void){
        this.log(`exec ${directiveName} with ${payload}`);

        const task:TaskInfo = this.frontend.formatUserInput(
            directiveName,
            payload,
        );
        this.router.register(task.uuid, callback);
        this.scheduler.push(task);
    }
}
