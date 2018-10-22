import { PxerTask, Directive } from "./Task";
import {BaseResolver, SugarResolver} from "./Resolver";

class Router{
    static Exec(task: PxerTask) :Promise<PxerTask[]> {
        if (task.Options.EnableDebug) {
            console.log(`Router handling task ${task.ID}`)
        }
        switch (task.Directive) {
            case Directive.GetMemberWorks: return BaseResolver.GetMemberWorks(task);
            case Directive.ProcessWorkList: return SugarResolver.ProcessWorksList(task);
            case Directive.GetWorkInfo: return BaseResolver.GetWorkInfo(task);
            case Directive.GetUgoiraMeta: return BaseResolver.GetUgoiraMeta(task);
        }
        throw new Error("Router failed")
    }
}

export default Router