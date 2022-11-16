import {App} from '@slack/bolt'
import Interface from '../interface'
import MfaRequest from './flows/mfa/request'
import Config from "./config";
import TradeProposal from "./flows/trade/proposal";

export default class SlackBot extends Interface {
    private readonly config = Config
    private readonly app = new App({
        port: this.config.LISTENER_PORT,
        signingSecret: this.config.SIGNING_SECRET,
        token: this.config.BOT_TOKEN,
    })

    async start() {
        await this.app.start()
    }

    async stop() {
        await this.app.stop()
    }

    private readonly mfaFlow = new MfaRequest(this.app, this.config)
    getTwoFactorCode = this.withErrorLogging(this.mfaFlow.apply.bind(this.mfaFlow))

    private readonly tradeFlow = new TradeProposal(this.app, this.config)
    proposeTrade = this.withErrorLogging(this.tradeFlow.apply.bind(this.tradeFlow))

    async tradeCompleted(): Promise<void> {
        await this.app.start()
    }

    async error(reason?: any): Promise<never> {
        await this.app.client.chat.postMessage({
            channel: this.config.CHANNEL_ID,
            text: `Encountered error ${reason}`
        }).catch(e => {
            console.error('encountered error while reporting error', e)
        })

        throw reason
    }
}
