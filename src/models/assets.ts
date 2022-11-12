export type Asset = string

export type IAssetMapping = Map<Asset, number>

export class AssetMapping extends Map<Asset, number> implements ReadonlyMap<Asset, number> {
    constructor(mapping: IAssetMapping) {
        super(mapping)

        this.forEach((value, asset) => {
            if (value < 0) {
                throw new Error(`asset ${asset} cannot have negative value ${value}`)
            }
        })
    }

    static from(record: Record<Asset, number>): AssetMapping {
        return new AssetMapping(new Map(Object.entries(record)))
    }

    map<T>(fn: (value: number, symbol: Asset) => T): T[] {
        const result: T[] = []
        this.forEach((value, symbol) => result.push(fn(value, symbol)))
        return result
    }

    get sum(): number {
        return this.map(v => v).reduce((a, b) => a + b, 0)
    }
}
