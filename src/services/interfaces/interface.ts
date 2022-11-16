import {TradeOrder} from "../../models/trade";

export interface ProposeTradeParams {
    trade: TradeOrder<any>
    reason: string
    proof: Buffer
}

export default abstract class Interface {
    abstract start(): Promise<void>

    abstract stop(): Promise<void>

    abstract getTwoFactorCode(): Promise<string>

    abstract proposeTrade(args: ProposeTradeParams): Promise<boolean>

    abstract tradeCompleted(): void

    abstract error(message: string): Promise<void>

    protected withErrorLogging<T, U>(fn: (...args: T[]) => Promise<U>) {
        return (...args: Parameters<typeof fn>) => {
            return fn(...args).catch(async e => {
                await this.error(e)
                throw e
            })
        }
    }
}
