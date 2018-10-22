import PxerScheduler from "./index";
import { Directive } from "./src/Task";
import { GetMemberWorksPayload } from "./src/Task";
import { writeFileSync, readFileSync } from "fs";
import process from "process"
import commander from "commander"
import { finished } from "stream";

commander
    .option("-s, --session <PHPSESSID>", "PHPSESSID", /[\w\d]+/)
    .option("-r, --recover <file>", "Recover from file");

commander.parse(process.argv);

if (!commander.session) {
    console.error("You must specity a PHPSESSID by flag -s")
    process.exit(1)
}

(<any>global).PHPSESSID = commander.session

let app: PxerScheduler;

if (commander.recover) {
    console.log("Recovering")
    app = PxerScheduler.load(readFileSync(commander.recover).toString())
} else {
    app = new PxerScheduler();

    app.init({
        Directive: Directive.GetMemberWorks,
        Payload: <GetMemberWorksPayload>{
            UserID: "12104609",
        },
        Options: {
            WantedTypes: ['manga','illust','ugoira'],
            IncludeDetailedWorkInfo: true,
            IncludeUgoiraMeta: true,
            EnableDebug: false,
        }
    })
}

let progressint = setInterval(()=>{
    let [finished, total] = app.getProgress()
    console.log(`${finished}/${total} (${(finished/total*100).toFixed(2)}%)`)
}, 1000)

function outputResult(){
    let [works, err] = app.collect();
    console.log("Writing results to ./result.json")
    writeFileSync("./result.json", JSON.stringify(works))
    console.log(`Collected errors: ${JSON.stringify(err)}`)
}

app.run().then(()=>{
    clearInterval(progressint)
    console.log("Finished")
    outputResult()
}).catch(e=>{
    console.error(e)
})

process.on("SIGINT", ()=>{
    console.log("Writing progress data to ./progress.json")
    console.log("Use --recover ./progress.json to continue this session.")
    outputResult()
    writeFileSync("./progress.json", app.save())
    process.exit(2)
})