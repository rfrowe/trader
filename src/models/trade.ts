import {Asset} from "./assets";
import Brokerage from "../services/banks/brokerage";

export enum TradeAction {
    BUY = "BUY",
    SELL = "SELL",
}

export type BuyOrder = TradeOrder<TradeAction.BUY>
export type SellOrder = TradeOrder<TradeAction.SELL>

export interface TradeOrder<T extends TradeAction = TradeAction> {
    asset: Asset,
    action: T
    account: string,
    brokerage: Brokerage,
    amount: number,
}
