class WaitGroup {
    private cbs: (()=>any)[]
    private counter: number
    constructor() {
        this.cbs = []
        this.counter = 0
    }
    public add(): void {
        this.counter++
    }
    public done(): void {
        this.counter--
        this.check()
    }
    public wait(): Promise<void> {
        return new Promise<void>((resolve, reject)=>{
            this.cbs.push(resolve);
            this.check()
        })
    }
    public getCount(): number {
        return this.counter
    }
    private check() {
        if (this.counter === 0){
            this.cbs.forEach(cb=>cb())
            this.cbs = []
        }
    }
}

export default WaitGroup