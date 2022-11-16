import {BuyOrder, SellOrder, TradeAction, TradeOrder} from "../../models/trade";
import Interface from "../interfaces/interface";
import {Asset} from "../../models/assets";
import {AccountBalance} from "../../models/balance";

export default abstract class Brokerage {
    abstract name: string

    processTrade(trade: TradeOrder, notifier: Interface): Promise<boolean> {
        switch (trade.action) {
            case TradeAction.BUY:
                return this.buy(trade as BuyOrder, notifier)
            case TradeAction.SELL:
                return this.sell(trade as SellOrder)
        }
    }

    async processTrades(notifier: Interface, ...trades: TradeOrder[]): Promise<boolean[]> {
        let success = true
        const results = []

        for (const trade of trades) {
            if (success) {
                success = await this.processTrade(trade, notifier)
            }

            results.push(success)
        }

        return results
    }

    abstract buy(trade: BuyOrder, notifier: Interface): Promise<boolean>

    abstract sell(trade: SellOrder): Promise<boolean>

    abstract positions(notifier: Interface, ...assets: Asset[]): Promise<AccountBalance>
}
