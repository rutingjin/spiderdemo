import { allSettledStatusEnum } from './enum'

/**
 * defined the type of value that allSettled function returned when it invoked success
 */
export interface allSettledSuccess {
    status: allSettledStatusEnum,
    value: any
}

/**
 * defined the type of value that allSettled function returned when it invoked error
 */
export interface allSettledError {
    status: allSettledStatusEnum,
    reason: any
}

/**
 * defined EventCount internal data structures
 */
interface EventCountCenter<T> {
    total: number,
    count: number,
    notify: (args?: T) => Promise<T>,
    result: Array<allSettledSuccess | allSettledError>,
}

/**
 * Used to simulate the allSettled method
 */
class EventCount {
    private center: EventCountCenter<Array<allSettledSuccess | allSettledError>> = {
        total: 0,
        count: 0,
        notify: () => Promise.resolve([]),
        result: []
    }
    constructor (length: number) {
        this.center.total = length
    }

    emit(result: allSettledSuccess | allSettledError) {
        this.center.count++
        this.center.result.push(result)
        if (this.center.count === this.center.total) {
            this.center.notify.call(this, this.center.result)
        }
    }

    notify(cb: (args?: Array<allSettledSuccess | allSettledError>) => Promise<Array<allSettledSuccess | allSettledError>>) {
        this.center.notify = cb
    }
}

/**
 * promise allSettled method polyfill
 * @param args
 */
export default function allSettled<T>(args: Promise<T>[]): Promise<Array<allSettledSuccess | allSettledError>> {
    const counter = new EventCount(args.length)
    return new Promise<Array<allSettledSuccess | allSettledError>>(resolve => {
        if (args.length === 0) {
            resolve([])
        } else {
            counter.notify(resolve as (args?: Array<allSettledSuccess | allSettledError>) => Promise<Array<allSettledSuccess | allSettledError>>)
            args.forEach((singlePromise: Promise<T>) => {
                singlePromise.then((data: T) => {
                    counter.emit({ status: allSettledStatusEnum.fulfilled, value: data })
                }).catch((err: T) => {
                    counter.emit({ status: allSettledStatusEnum.rejected, reason: err })
                })
            })
        }
    })
}
