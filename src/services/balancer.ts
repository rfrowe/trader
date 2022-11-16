import {AssetAllocation} from "../models/allocation";
import {AccountBalance} from "../models/balance";
import {TradeAction, TradeOrder} from "../models/trade";

export default class PortfolioBalancer {
    accountBalance: AccountBalance

    constructor(accountBalance: AccountBalance) {
        this.accountBalance = accountBalance
    }

    rebalance(targetAllocation: AssetAllocation, additionalFunds: number = 0): TradeOrder[] {
        if (additionalFunds < 0) {
            throw new Error('rebalance is not supported on withdraws')
        }

        const targetBalance = targetAllocation.toBalance(this.accountBalance.sum + additionalFunds)

        return targetBalance.map((targetAmount, asset) => {
            const delta = targetAmount - (this.accountBalance.get(asset) || 0)
            if (Math.abs(delta) < 1) {
                return undefined
            }

            const action = delta > 0 ? TradeAction.BUY : TradeAction.SELL
            if (action == TradeAction.SELL) {
                throw new Error('rebalance does not support selling')
            }

            additionalFunds -= delta
            if (additionalFunds < 0) {
                throw new Error('insufficient funds to rebalance')
            }

            return {
                asset,
                action,
                amount: delta,
            }
        }).filter((trade): trade is TradeOrder<any> => trade !== undefined)
    }
}
