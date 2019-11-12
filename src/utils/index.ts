import chalk from 'chalk'

/**
 * decode base64
 * @param base64String
 * @constructor
 */
function Base64ToSting (base64String: string): string {
    return Buffer.from(base64String, 'base64').toString()
}

/**
 * decode SSR Link
 * @param list
 */
export function decodeSSRLink (list: string[]): SSRNode[] {
    return list.map(link => {
        const originString = Base64ToSting(
            link.split('/')[2]
        )
        const nodeInfo = originString
            .split('/')[0]
            .split(':')
        const remarkInfo = originString
            .split('/')[1]
            .replace('?', '')
            .split('&')
        const config: SSRNode = {
            remarks : '',
            id : Math.random().toString().replace('0.', ''),
            server : nodeInfo[0],
            server_port : nodeInfo[1],
            server_udp_port : 0,
            password : Base64ToSting(nodeInfo[5]),
            method : nodeInfo[3],
            protocol : nodeInfo[2],
            protocolparam : '',
            obfs : nodeInfo[4],
            obfsparam : '',
            remarks_base64 : '',
            group : '',
            enable : true,
            udp_over_tcp : false
        }

        remarkInfo.forEach((str:string | undefined) => {
            if (!str) return
            const info = str.split('=')
            config[info[0]] = Base64ToSting(info[1])
            if (info[0] === 'remarks') {
                config.remarks_base64 = info[1];
            }
        })
        return config
    })
}

/**
 * export platform type
 */
export const platform = process.platform

/**
 * export log function
 * @param content
 * @param success
 */
export function log(content:string, success?:boolean):void {
    if (typeof success === "boolean") {
        if (success) {
            console.log(chalk.green(content))
        } else {
            console.log(chalk.red(content))
        }
    } else {
        console.log(
            content.replace(
                /\d+/g,
                (number) => {
                    return chalk.magentaBright(number)
                }
            )
        )
    }
}
