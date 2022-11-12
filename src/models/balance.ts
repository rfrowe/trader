import {IAssetMapping, AssetMapping, Asset} from "./assets";

export class AccountBalance extends AssetMapping {
    constructor(balances: IAssetMapping) {
        super(balances)

        if (this.sum <= 1.0) {
            throw new Error(`account balance is too low (${this.sum} USD)`)
        }
    }

    static from(record: Record<Asset, number>): AccountBalance {
        return new AccountBalance(AssetMapping.from(record))
    }
}
