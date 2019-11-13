import unique from "./unique";
import batchPing from './ping'
import batchCrossTest from './crossTest'
import { log } from '../utils'

export default class FilterNode {
    private nodeList: SSRNode[]
    constructor(nodeList: SSRNode[]) {
        this.nodeList = nodeList
        log(`There are currently ${this.nodeList.length} nodes waiting to be processed`)
    }

    async check (): Promise<SSRNode[]> {
        this.nodeList = unique(this.nodeList)
        log(`The duplicate data has been deleted, remaining ${this.nodeList.length} nodes.`)
        this.nodeList = await batchPing(this.nodeList)
        log(`Host usability testing complete, remaining ${this.nodeList.length} nodes.`)
        this.nodeList = await batchCrossTest(this.nodeList)
        log(`Nodes availability test completed, remaining ${this.nodeList.length} nodes.`)
        return Promise.resolve(this.nodeList)
    }
}
