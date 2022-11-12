import {Asset} from "./assets";

export enum TradeAction {
    BUY = "BUY",
    SELL = "SELL",
}

export type BuyOrder = TradeOrder<TradeAction.BUY>
export type SellOrder = TradeOrder<TradeAction.SELL>

export interface TradeOrder<T extends TradeAction> {
    asset: Asset,
    action: T
    amount: number
}
