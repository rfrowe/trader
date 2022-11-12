import {Asset} from "./assets";

export enum TradeAction {
    BUY = "BUY",
    SELL = "SELL",
}

export interface TradeOrder {
    asset: Asset,
    action: TradeAction
    amount: number
}
