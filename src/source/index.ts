import {readdirSync, existsSync, mkdirSync, readFileSync} from "fs"
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

const normalPath = path.resolve(__dirname, './normal/')
const proxyPath = path.resolve(__dirname, './proxy')

if (!existsSync(normalPath)) {
    mkdirSync(normalPath)
}
if (!existsSync(proxyPath)) {
    mkdirSync(proxyPath)
}
const normalFiles = readdirSync(normalPath)
const proxyFiles = readdirSync(proxyPath)
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
                log((item as allSettledError).reason, false)
            }
            return item.status === allSettledStatusEnum.fulfilled
        })
            .map(item => (item as allSettledSuccess).value)
            .reduce((pre: SSRNode[], next: SSRNode[]) => pre.concat(next), [])
        try {
            let cache = []
            if (existsSync(path.resolve(__dirname, '../../data/'))) {
                let cacheText = readFileSync(path.resolve(__dirname, '../../data/data.json'))
                cache = JSON.parse(cacheText.toString())
            }
            resolve({result: normalResult.concat(cache), next: generateNext})
        } catch (e) {
            resolve({result: normalResult, next: generateNext})
        }
    })
}
