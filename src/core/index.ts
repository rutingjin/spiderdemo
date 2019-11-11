import { exec } from "child_process"
import path from 'path'
import request from 'request'
import { readFileSync, writeFileSync } from 'fs'

interface withCountTimeNode {
    requestTime: number,
    node: SSRNode
}

export default class FilterNode {
    private nodeList: SSRNode[]
    constructor(nodeList: SSRNode[]) {
        this.nodeList = nodeList
        console.log(`当前共有${this.nodeList.length}个节点待处理`)
    }

    async check (): Promise<SSRNode[]> {
        this.nodeList = this.unique(this.nodeList)
        console.log(`去重处理完成，剩余${this.nodeList.length}个节点`)
        this.nodeList = await this.batchPing(this.nodeList)
        console.log(`连通性测试完成，剩余${this.nodeList.length}个节点`)
        process.on('exit', this.stopSSR)
        this.nodeList = await this.batchCrossTest(this.nodeList)
        console.log(`可用性测试完成，剩余${this.nodeList.length}个节点`)
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

    private ping (node:SSRNode): Promise<SSRNode | undefined> {
        return new Promise(resolve => {
            exec(
                `chcp 65001 && ping -n 3 ${node.server}`,
                { windowsHide: true },
                (err) => {
                    if (err) {
                        resolve()
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
            Promise.all(promises).then(res => {
                resolve(Array.prototype.filter.call(res, (node: SSRNode | undefined) => node !== undefined))
            })
        })
    }

    private startSSR():Promise<undefined> {
        return new Promise(resolve => {
            // @ts-ignore
            let targetPath = path.resolve(__dirname, '../../bin/win32/SSR.exe')
            exec(`start ${targetPath}`,{ windowsHide: true })
            // Wait for client startup to complete
            setTimeout(resolve, 3000)
        })
    }

    private stopSSR():Promise<undefined> {
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

    private crossTest(node: SSRNode): Promise<withCountTimeNode | undefined> {
        return new Promise((resolve) => {
            const start = new Date().getTime()
            console.log(`通过${node.server}代理开始请求google`)
            request('https://www.google.as',
                { proxy: 'http://127.0.0.1:6665', timeout: 3000 },
                (error, response, body) => {
                    console.log('请求发送完成')
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
                console.log(`还剩${copy.length + 1}个节点需要检测😙`)
                this.writeSSRConfig(node)
                await this.startSSR()
                console.log(`正在检测 ${node.server}节点访问是否通畅`)
                let res:withCountTimeNode| undefined = await this.crossTest(node)
                if (res) {
                    console.log(`-------------------${node.server}节点可用😀---------------------`)
                    result.push(res)
                } else {
                    console.log(`${node.server}节点已被爆破😭`)
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
