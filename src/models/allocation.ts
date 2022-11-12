import {IAssetMapping, AssetMapping, Asset} from "./assets";
import {AccountBalance} from "./balance";

export class AssetAllocation extends AssetMapping {
    constructor(allocation: IAssetMapping) {
        super(allocation)

        if (this.sum != 1.0) {
            throw new Error(`asset allocation does not sum to 100% (${this.sum * 100} %)`)
        }
    }

    static from(record: Record<Asset, number>): AssetAllocation {
        return new AssetAllocation(AssetMapping.from(record))
    }

    static fromBalance(balance: AccountBalance) {
        const total = balance.sum
        const toProportion = (amount: number, asset: Asset): [Asset, number] => [asset, amount / total];
        return new AssetAllocation(new Map(balance.map(toProportion)))
    }

    toBalance(balance: number): AccountBalance {
        if (balance < 0) {
            throw new Error('cannot convert to negative account balance')
        }

        const toBalance = (proportion: number, asset: Asset): [Asset, number] => [asset, proportion * balance]
        const account = new AccountBalance(new Map(this.map(toBalance)))
        if (account.sum != balance) {
            throw new Error(`failed to convert allocation to balance (${account.sum} != ${balance}`)
        }

        return account
    }
}
