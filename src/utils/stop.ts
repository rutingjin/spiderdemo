import {exec} from "child_process";
import { platformEnum } from "./enum";

export default function ():Promise<void> {
    return new Promise((resolve, reject) => {
        switch (process.platform) {
            // Compatible with windows platform
            case platformEnum.window:
                exec(
                    'taskkill /f /im SSR.exe',
                    { windowsHide: true },
                    err => {
                        // Ignore errors that the process did not find
                        if (err && err.message.indexOf('not found') === -1) {
                            reject(new Error('An error occurred while kill the ssr process'))
                        }
                        // Wait for client stop to complete
                        resolve()
                    }
                )
                break
            default:
                // TODO: Other systems are not yet compatible
                reject(new Error('Only support windows platform, other systems are not yet compatible'))
        }
    })
}
