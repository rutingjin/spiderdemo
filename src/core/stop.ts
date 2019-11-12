import {exec} from "child_process";
import { platformEnum } from "../utils";

export default function ():Promise<void> {
    return new Promise((resolve, reject) => {
        switch (process.platform) {
            // Compatible with windows platform
            case platformEnum.window:
                exec(
                    'taskkill /f /im SSR.exe',
                    { windowsHide: true },
                    err => {
                        if (err) {
                            reject()
                        }
                        // Wait for client stop to complete
                        resolve()
                    }
                )
                break
            default:
                // TODO: Other systems are not yet compatible
                reject()
        }
    })
}
