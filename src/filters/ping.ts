import { exec } from "child_process"
import {allSettled, allSettledStatusEnum, allSettledSuccess, platformEnum} from '../utils'

/**
 * verify domain/server is operating and network accessible.
 * @param node
 */
function ping (node: SSRNode): Promise<SSRNode> {
    return new Promise<SSRNode>((resolve, reject) => {
        switch (process.platform) {
            // Compatible with windows platform
            case platformEnum.window:
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
                break
            default:
                // TODO: Other systems are not yet compatible
                reject()
        }
    })
}

/**
 * Bulk verification
 * @param arr
 */
export default function batchPing(arr: SSRNode[]): Promise<SSRNode[]> {
    return new Promise<SSRNode[]>(async resolve => {
        let copy = arr.slice(0)
        const promises = []
        while (copy.length > 0) {
            let node = copy.shift()
            promises.push(ping(node))
        }
        allSettled(promises).then(res => {
            resolve(
                res.filter(item => item.status === allSettledStatusEnum.fulfilled)
                    .map(item => (item as allSettledSuccess).value)
            )
        })
    })
}
