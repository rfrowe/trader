import {App} from '@slack/bolt'
import {Config} from '../config'
import {newPromise, Rejector, Resolver} from '../../../../utils'

interface State<T> {
    promise: Promise<T>
    reject: Rejector
    resolve: Resolver<T>
    timeout: NodeJS.Timeout | undefined
}

export abstract class Flow<T> {
    constructor(
        protected readonly app: App,
        protected readonly config: Config,
    ) {
        this.init()
    }

    protected init(): void {}

    protected promise(timeoutMs?: number): Promise<T> {
        this.reject('promise superseded')

        let timeout: NodeJS.Timeout | undefined
        if (timeoutMs !== undefined) {
            timeout = setTimeout(() => this.reject(`timed out after ${timeoutMs} ms`), timeoutMs)
        }

        const state: State<T> = {
            timeout,
            ...newPromise()
        }
        this._promise = state

        return state.promise
    }

    protected resolve: Resolver<T> = (value) => {
        const promise = this._promise
        if (promise === undefined) {
            return
        }

        clearTimeout(promise.timeout)
        promise.resolve(value)
        this._promise = undefined
    }

    protected reject: Rejector = (reason) => {
        const promise = this._promise
        if (promise === undefined) {
            return
        }

        clearTimeout(promise.timeout)
        promise.reject(reason)
        this._promise = undefined
    }

    protected get done(): boolean {
        return this._promise === undefined
    }

    private _promise: State<T> | undefined
}
