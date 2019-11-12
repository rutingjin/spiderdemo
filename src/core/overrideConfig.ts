import path from "path";
import {readFile, writeFile} from "fs";

const filePath = path.resolve(__dirname, '../../bin/win32/gui-config.json')

export default function (node: SSRNode):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        readFile(filePath, (err, data) => {
            if (err) {
                reject()
            }
            let SSRConfig = JSON.parse(data.toString())
            SSRConfig.configs = [node]
            writeFile(
                filePath,
                JSON.stringify(SSRConfig, null, 2),
                (err) => {
                    if (err) {
                        reject()
                    }
                    resolve()
                }
            )
        })
    })
}
