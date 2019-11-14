import path from "path";
import {readFile, writeFile} from "fs";
import { platformEnum } from './enum'

export default function (node: SSRNode):Promise<proxyConfig> {
    return new Promise<proxyConfig>((resolve, reject) => {
        // Compatible with windows platform
        if (process.platform === platformEnum.window) {
            const filePath = path.resolve(__dirname, '../../bin/win32/gui-config.json')
            readFile(filePath, (err, data) => {
                if (err) {
                    reject(new Error('An error occurred while reading the config file.'))
                } else {
                    let SSRConfig = JSON.parse(data.toString())
                    SSRConfig.configs = [node]
                    writeFile(
                        filePath,
                        JSON.stringify(SSRConfig, null, 2),
                        (err) => {
                            if (err) {
                                reject(new Error('An error occurred while writing the config file.'))
                            }
                            resolve({ proxy: `http://127.0.0.1:${SSRConfig.localPort}` })
                        }
                    )
                }
            })
        } else {
            // TODO: Other systems are not yet compatible
            reject(new Error('Only support windows platform, other systems are not yet compatible'))
        }
    })
}
