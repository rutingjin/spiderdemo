import {readdirSync} from "fs"
import path from 'path'
import {
    allSettled,
    allSettledStatusEnum,
    allSettledSuccess,
    allSettledError,
    overrideConfig,
    startSSR,
    stopSSR,
    log
} from '../utils'

const normalFiles = readdirSync(path.resolve(__dirname, './normal/'))
const proxyFiles = readdirSync(path.resolve(__dirname, './proxy'))
const normalGetters: normalSourceGetter[] = normalFiles.map((fileName: string) => require(`./normal/${fileName}`).default)
const proxyGetters: proxySourceGetter[] = proxyFiles.map((fileName: string) => require(`./proxy/${fileName}`).default)

export interface generateResult {
    result: SSRNode[],
    next: (seed: SSRNode) => Promise<SSRNode[]>
}

/**
 * Import an available seed node to get the remaining nodes
 * @param seed
 */
function generateNext(seed: SSRNode): Promise<SSRNode[]> {
    return new Promise<SSRNode[]>(async (resolve) => {
        const proxyPromises: Promise<SSRNode[]>[] = []
        const proxyConfig = await overrideConfig(seed)
        await startSSR()
        proxyGetters.forEach((getter: proxySourceGetter) => proxyPromises.push(getter(proxyConfig)))
        const proxyRes = await allSettled(proxyPromises)
        await stopSSR()
        const proxyResult = proxyRes.filter(item => {
            if (item.status !== allSettledStatusEnum.fulfilled) {
                log((item as allSettledError).reason.message, false)
            }
            return item.status === allSettledStatusEnum.fulfilled
        })
            .map(item => (item as allSettledSuccess).value)
            .reduce((pre: SSRNode[], next: SSRNode[]) => pre.concat(next), [])
        resolve(proxyResult)
    })
}

/**
 * generate SSR node info
 */
export default function (): Promise<generateResult> {
    return new Promise<generateResult>(async (resolve) => {
        const normalPromises: Promise<SSRNode[]>[] = []
        normalGetters.forEach((getter: normalSourceGetter) => {
            normalPromises.push(getter())
        })
        const normalRes = await allSettled(normalPromises)
        const normalResult = normalRes.filter(item => {
            if (item.status !== allSettledStatusEnum.fulfilled) {
                log((item as allSettledError).reason.message, false)
            }
            return item.status === allSettledStatusEnum.fulfilled
        })
            .map(item => (item as allSettledSuccess).value)
            .reduce((pre: SSRNode[], next: SSRNode[]) => pre.concat(next), [])
        resolve({result: normalResult, next: generateNext})
    })
}
