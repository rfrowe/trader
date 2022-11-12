import {BuyOrder, SellOrder, TradeAction, TradeOrder} from "../../models/trade";

export default abstract class Brokerage {
    processTrade(trade: TradeOrder<TradeAction>): Promise<boolean> {
        switch (trade.action) {
            case TradeAction.BUY:
                return this.buy(trade as BuyOrder)
            case TradeAction.SELL:
                return this.sell(trade as SellOrder)
        }
    }

    processTrades(...trades: TradeOrder<TradeAction>[]): Promise<boolean>[] {
        return trades.map(trade => this.processTrade(trade))
    }

    abstract buy(trade: BuyOrder): Promise<boolean>

    abstract sell(trade: SellOrder): Promise<boolean>
}
