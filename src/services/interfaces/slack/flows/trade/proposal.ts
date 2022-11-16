import {Flow} from "../index";
import {TradeAction} from "../../../../../models/trade";
import Upload from "../upload";
import {ProposeTradeParams} from "../../../interface";

const approveId = 'trade:accept'
const rejectId = 'trade:decline'

export default class TradeProposal extends Flow<boolean> {
    protected override init(): void {
        this.app.action(approveId, async ({ack}) => {
            await ack()
            await this.resolve(true)
        })
        this.app.action(rejectId, async ({ack}) => {
            await ack()
            await this.resolve(false)
        })
    }

    async apply({trade, reason, proof}: ProposeTradeParams): Promise<boolean> {
        const promise = this.promise()

        let verb
        switch (trade.action) {
            case TradeAction.BUY:
                verb = 'purchase'
                break;
            case TradeAction.SELL:
                verb = 'sale'
                break;
        }

        const subject = `Confirm *${verb}* of *${trade.asset}* in the amount of *${trade.amount} USD*?`
        const message = [
            `Hello, we would like to authorize a trade for *${trade.brokerage.name}* account number *${trade.account}* to ${reason}`,
            '',
            subject,
        ].join('\n')

        await this.app.client.chat.postMessage({
            channel: this.config.CHANNEL_ID,
            text: subject,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: message,
                    },
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                emoji: true,
                                text: 'Approve',
                            },
                            style: 'primary',
                            action_id: approveId,
                        }, {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                emoji: true,
                                text: 'Reject',
                            },
                            style: 'danger',
                            action_id: rejectId,
                        },
                    ]
                }
            ]
        }).catch(e => this.reject(`failed to send message to channel ${this.config.CHANNEL_ID}: ${e}`))

        await Upload.imageToChannel(this.app, this.config, proof, 'trade.png')
            .catch(e => this.reject(`failed to upload proof: ${e}`))

        return promise
    }

}
