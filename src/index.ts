import { writeFile, existsSync, mkdirSync } from "fs"
import path from 'path'
import Filter from './filters'
import source  from './source'
import { log } from './utils'

async function main():Promise<void> {
    log('Start getting node information from trusted origin')
    const data = await source()
    log(`The first stage is completed, get ${data.result.length} nodes`)
    if (data.result.length === 0) return void 0
    const result = await new Filter(data.result).check()
    // Writes information that has been obtained
    writeFile(
        path.resolve(__dirname, '../data/data.json'),
        JSON.stringify(result, null, 2),
        err => {
            if (err) {
                log('Writing data error', false)
            }
        }
    )
    if (result.length === 0) {
        log('Can not find available node')
        return void 0
    }
    log('Start fetching the remaining nodes')
    // Continue to get the rest of the information
    const other = await data.next(result[0])
    log(`Getting the remaining nodes is done, get ${other.length} nodes`)
    if (other.length === 0) return void 0
    const restInfo = await new Filter(other).check()
    // Writes all node information
    if (!existsSync(path.resolve(__dirname, '../data/'))) {
        mkdirSync(path.resolve(__dirname, '../data/'))
    }
    writeFile(
        path.resolve(__dirname, '../data/data.json'),
        JSON.stringify(result.concat(restInfo), null, 2),
        err => {
            log(err.message, false)
        }
    )
}

main().then(() => {
    log('All work is done', true)
}).catch(err => {
    log(`An error has occurred. ${err.message}`, false)
})
