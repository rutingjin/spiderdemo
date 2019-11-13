import path from "path";
import {exec} from "child_process";
import { platformEnum } from "./enum";

export default function ():Promise<void> {
    return new Promise((resolve, reject) => {
        switch (process.platform) {
            // Compatible with windows platform
            case platformEnum.window:
                // @ts-ignore
                let targetPath = path.resolve(__dirname, '../../bin/win32/SSR.exe')
                exec(`start ${targetPath}`,{ windowsHide: true })
                // Wait for client startup to complete
                setTimeout(resolve, 3000)
                break
            default:
                // TODO: Other systems are not yet compatible
                reject()
        }
    })
}
