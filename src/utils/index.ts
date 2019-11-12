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
 * export support platform enum
 */
export enum platformEnum {
    window = 'win32',
    linux = 'linux',
    macOS = 'darwin'
}

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

/**
 * defined the type of status that allSettled function returned
 */
export enum EventCountStatus { fulfilled = 'fulfilled',  rejected = 'rejected'}

/**
 * defined the type of value that allSettled function returned when it invoked success
 */
export interface EventCountSuccess {
    status: EventCountStatus,
    value: any
}

/**
 * defined the type of value that allSettled function returned when it invoked error
 */
interface EventCountError {
    status: EventCountStatus,
    reason: any
}

/**
 * defined EventCount internal data structures
 */
interface EventCountCenter<T> {
    total: number,
    count: number,
    notify: (args?: T) => Promise<T>,
    result: Array<EventCountSuccess | EventCountError>,
}

/**
 * Used to simulate the allSettled method
 */
class EventCount {
    private center: EventCountCenter<Array<EventCountSuccess | EventCountError>> = {
        total: 0,
        count: 0,
        notify: () => Promise.resolve([]),
        result: []
    }
    constructor (length: number) {
        this.center.total = length
    }

    emit(result: EventCountSuccess | EventCountError) {
        this.center.count++
        this.center.result.push(result)
        if (this.center.count === this.center.total) {
            this.center.notify.call(this, this.center.result)
        }
    }

    notify(cb: (args?: Array<EventCountSuccess | EventCountError>) => Promise<Array<EventCountSuccess | EventCountError>>) {
        this.center.notify = cb
    }
}

/**
 * promise allSettled method polyfill
 * @param args
 */
export function allSettled<T>(args: Promise<T>[]): Promise<Array<EventCountSuccess | EventCountError>> {
    const counter = new EventCount(args.length)
    return new Promise<Array<EventCountSuccess | EventCountError>>(resolve => {
        counter.notify(resolve as (args?: Array<EventCountSuccess | EventCountError>) => Promise<Array<EventCountSuccess | EventCountError>>)
        args.forEach((singlePromise: Promise<T>) => {
            singlePromise.then((data: T) => {
                counter.emit({ status: EventCountStatus.fulfilled, value: data })
            }).catch((err: T) => {
                counter.emit({ status: EventCountStatus.rejected, reason: err })
            })
        })
    })
}
