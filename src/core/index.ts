import { exec } from "child_process"
import path from 'path'
import request from 'request'
import { readFileSync, writeFileSync } from 'fs'
import { log, EventCountStatus, EventCountSuccess, allSettled } from '../utils'

interface withCountTimeNode {
    requestTime: number,
    node: SSRNode
}

export default class FilterNode {
    private nodeList: SSRNode[]
    constructor(nodeList: SSRNode[]) {
        this.nodeList = nodeList
        log(`There are currently ${this.nodeList.length} nodes waiting to be processed`)
    }

    async check (): Promise<SSRNode[]> {
        this.nodeList = this.unique(this.nodeList)
        log(`The duplicate data has been deleted, remaining ${this.nodeList.length} nodes.`)
        this.nodeList = await this.batchPing(this.nodeList)
        log(`Host usability testing complete, remaining ${this.nodeList.length} nodes.`)
        process.on('exit', this.stopSSR)
        this.nodeList = await this.batchCrossTest(this.nodeList)
        log(`Nodes availability test completed, remaining ${this.nodeList.length} nodes.`)
        return Promise.resolve(this.nodeList)
    }

    private unique(array: SSRNode[]): SSRNode[] {
        const container: { [propName: string]: boolean } = {}
        const result:SSRNode[] = []
        array.forEach(node => {
            let {server, server_port, password, method, protocol, obfs} = node
            let key = `${server}-${server_port}-${password}-${method}-${protocol}-${obfs}`
            if (!container[key]) {
                container[key] = true
                result.push(node)
            }
        })
        return result
    }

    private ping (node:SSRNode): Promise<SSRNode> {
        return new Promise<SSRNode>((resolve, reject) => {
            exec(
                `chcp 65001 && ping -n 3 ${node.server}`,
                { windowsHide: true },
                (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(node)
                    }
                }
            )
        })
    }

    private batchPing (arr: SSRNode[]): Promise<SSRNode[]> {
        return new Promise(async resolve => {
            let copy = arr.slice(0)
            const promises = []
            while (copy.length > 0) {
                let node = copy.shift()
                promises.push(this.ping(node))
            }
            allSettled(promises).then(res => {
                resolve(
                    res.filter(item => item.status === EventCountStatus.fulfilled)
                        .map(item => (item as EventCountSuccess).value)
                )
            })
        })
    }

    private startSSR():Promise<void> {
        return new Promise(resolve => {
            // @ts-ignore
            let targetPath = path.resolve(__dirname, '../../bin/win32/SSR.exe')
            exec(`start ${targetPath}`,{ windowsHide: true })
            // Wait for client startup to complete
            setTimeout(resolve, 3000)
        })
    }

    private stopSSR():Promise<void> {
        return new Promise((resolve => {
            exec(
                'taskkill /f /im SSR.exe',
                { windowsHide: true },
                () => {
                    // Wait for client stop to complete
                    resolve()
                }
            )
        }))
    }

    private crossTest(node: SSRNode): Promise<withCountTimeNode | void> {
        return new Promise((resolve) => {
            const start = new Date().getTime()
            log(`Start accessing the Google service through the proxy`)
            request('https://www.google.as',
                { proxy: 'http://127.0.0.1:6665', timeout: 3000 },
                (error, response, body) => {
                    log('Request sent complete')
                    if (!error && response && response.statusCode === 200 && body) {
                        resolve({
                            requestTime: new Date().getTime() - start,
                            node
                        })
                    }
                    resolve()
                }
            )
        })
    }

    private writeSSRConfig (node: SSRNode) {
        const filePath = path.resolve(__dirname, '../../bin/win32/gui-config.json')
        let SSRConfig = JSON.parse(readFileSync(filePath).toString())
        SSRConfig.configs = [node]
        writeFileSync(filePath, JSON.stringify(SSRConfig, null, 2))
    }

    private batchCrossTest(arr: SSRNode[]):Promise<SSRNode[]> {
        return new Promise(async resolve => {
            const copy = arr.slice(0)
            const result: withCountTimeNode[] = []
            await this.stopSSR()
            while (copy.length > 0) {
                let node = copy.shift()
                log(`The remaining ${copy.length + 1} nodes are waiting to be detected 😙`)
                this.writeSSRConfig(node)
                await this.startSSR()
                log(`Detecting ${node.server} availability`)
                let res:withCountTimeNode| void = await this.crossTest(node)
                if (res) {
                    log(`[${node.server}]: Find an available node 😀`, true)
                    result.push(res)
                } else {
                    log(`[${node.server}]: This node has expired 😭`, false)
                }
                await this.stopSSR()
            }
            const json = result
                .sort((pre:withCountTimeNode, next) => pre.requestTime - next.requestTime)
                .map(t => t.node)
            resolve(json)
        })
    }
}
