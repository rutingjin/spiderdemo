import request from "request";
import log from "./log";
import stopSSR from "./stop";
import overrideConfig from "./overrideConfig";
import startSSR from "./start";


interface withCountTimeNode {
    requestTime: number,
    node: SSRNode
}

function crossTest (node: SSRNode): Promise<withCountTimeNode> {
    return new Promise<withCountTimeNode>((resolve, reject) => {
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
                reject(new Error('An error occurred while accessing the Google service.'))
            }
        )
    })
}

export default function batchCrossTest (arr: SSRNode[]):Promise<SSRNode[]> {
    process.on('exit', stopSSR)
    return new Promise(async resolve => {
        const copy = arr.slice(0)
        const result: withCountTimeNode[] = []
        await stopSSR()
        while (copy.length > 0) {
            let node = copy.shift()
            log(`The remaining ${copy.length + 1} nodes are waiting to be detected 😙`)
            await overrideConfig(node)
            await startSSR()
            log(`Detecting ${node.server} availability`)
            try {
                let res:withCountTimeNode = await crossTest(node)
                log(`[${node.server}]: Find an available node 😀`, true)
                result.push(res)
            } catch (e) {
                log(`[${node.server}]: This node has expired 😭`, false)
            } finally {
                await stopSSR()
            }
        }
        const json = result
            .sort((pre:withCountTimeNode, next) => pre.requestTime - next.requestTime)
            .map(t => t.node)
        resolve(json)
    })
}
