import {baseResolvedRequest, createResult, PxerMixin, toQueryString, uuid} from "../common";
import {ResolveResult, TaskInfo} from "../types";
import {BaseResolved} from "../index";

export enum Flags {
    getUserIllustsDataAll_getAllWorks,

    getUserWorks_getUserProfile,
    getUserWorks_getUserIllustsDataAll,
}

export default class SugarResolver extends PxerMixin {
    /**
     * Get user works data by user id.
     * 1. get user profile to count how many works he had. The flag is getUserWorks_getUserProfile.
     * 2. get all works data. The flag is getUserWorks_getUserIllustsDataAll.
     * 3. collect & format
     * */
    getUserWorks(task:TaskInfo, callback:(result:ResolveResult)=>void){
        switch (task.flag) {
            default: {
                const getProfile = this.frontend.createTask({
                    uuid: `${task.uuid}.profile`,
                    name: 'getUserProfile',
                    payload: {
                        userId: (<any>task.payload).userId,
                    },
                });

                task.flag = Flags.getUserWorks_getUserProfile;
                task.state = 'wait';
                task.dependOn = [getProfile.uuid];

                this.scheduler.push(getProfile);
                break;
            } case Flags.getUserWorks_getUserProfile: {
                if(task.dependOnTask!.every(task => task.state === 'fulfilled')){
                    const body = task.dependOnTask![0].result!.body;
                    const getUserIllust = this.frontend.createTask({
                        uuid: `${task.uuid}.illust`,
                        name: 'getUserIllustsDataAll',
                        payload: {
                            userId: (<any>task.payload).userId,
                            ids: [...Object.keys(body.illusts), ...Object.keys(body.manga)],
                        },
                    });

                    task.flag = Flags.getUserWorks_getUserIllustsDataAll;
                    task.state = 'wait';
                    task.dependOn = [getUserIllust.uuid];

                    this.scheduler.push(getUserIllust);
                }else{
                    const failedTask = task.dependOnTask!.find(task => task.state === 'rejected')!;
                    callback(createResult(
                        failedTask.result!.errcode,
                        [failedTask.uuid].concat(failedTask.result!.errmsg),
                    ));
                }
                break;
            } case Flags.getUserWorks_getUserIllustsDataAll: {
                if(task.dependOnTask!.every(task => task.state === 'fulfilled')){
                    callback(createResult({
                        works: task.dependOnTask![0].result!.works,
                    }));
                }else{
                    const failedTask = task.dependOnTask!.find(task => task.state === 'rejected')!;
                    callback(createResult(
                        failedTask.result!.errcode,
                        [failedTask.uuid].concat(failedTask.result!.errmsg),
                    ));
                }
                break;
            }
        }
    }

    /**
     * Get user all works data by works id list
     * 1. split the group, create multiple tasks. The flag is getUserIllustsDataAll_getAllWorks
     * 2. collect & format
     * */
    getUserIllustsDataAll(task:TaskInfo, callback:(result:ResolveResult)=>void){
        switch (task.flag) {
            default: {
                const {userId,ids}:{userId:string,ids:string[]} = task.payload as any;
                const newTasks: TaskInfo [] = [];

                const maxIds = BaseResolved.getUserIllustsDataIdsMaxLength;
                for(let i = 0; i<ids.length; i+=maxIds){
                    newTasks.push(this.frontend.createTask({
                        uuid: `${task.uuid}.${i/maxIds}`,
                        name: 'getUserIllustsData',
                        payload: {
                            userId,
                            ids: ids.slice(i, Math.min((i+maxIds), ids.length-1)),
                        },
                    }));
                };

                task.flag = Flags.getUserIllustsDataAll_getAllWorks;
                task.state = 'wait';
                task.dependOn = newTasks.map(task => task.uuid);

                this.scheduler.push(...newTasks);

                break;
            } case Flags.getUserIllustsDataAll_getAllWorks: {
                if(task.dependOnTask!.every(task => task.state === 'fulfilled')){
                    const works:any[] = [];
                    task.dependOnTask!.forEach(task => works.push(...Object.values(task.result!.body)));

                    callback(createResult({
                        works,
                    }));
                }else{
                    const failedTask = task.dependOnTask!.find(task => task.state === 'rejected')!;
                    callback(createResult(
                        failedTask.result!.errcode,
                        [failedTask.uuid].concat(failedTask.result!.errmsg),
                    ));
                }
                break;
            }
        }
    }
}


