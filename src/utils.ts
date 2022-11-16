export function error(message: string): never {
    throw new Error(message)
}

export type Resolver<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>[0]
export type Rejector = Parameters<ConstructorParameters<typeof Promise>[0]>[1];

export function newPromise<T>(): {promise: Promise<T>, resolve: Resolver<T>, reject: Rejector} {
    let resolve: Resolver<T> | undefined
    let reject: Rejector | undefined
    return {
        promise: new Promise<T>((res, rej) => {
            resolve = res
            reject = rej
        }),
        resolve: resolve!,
        reject: reject!,
    }
}
