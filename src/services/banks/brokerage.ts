import {BuyOrder, SellOrder, TradeAction, TradeOrder} from "../../models/trade";
import Interface from "../interfaces/interface";

export default abstract class Brokerage {
    abstract name: string

    processTrade(trade: TradeOrder<TradeAction>, notifier: Interface): Promise<boolean> {
        switch (trade.action) {
            case TradeAction.BUY:
                return this.buy(trade as BuyOrder, notifier)
            case TradeAction.SELL:
                return this.sell(trade as SellOrder)
        }
    }

    processTrades(notifier: Interface, ...trades: TradeOrder<TradeAction>[]): Promise<boolean>[] {
        return trades.map(trade => this.processTrade(trade, notifier))
    }

    abstract buy(trade: BuyOrder, notifier: Interface): Promise<boolean>

    abstract sell(trade: SellOrder): Promise<boolean>
}
