import {Flow} from "../index";
import {BlockAction} from "@slack/bolt";
import MfaModal from "./modal";

const actionId = 'mfa:request'

const text = 'I sent you a SMS code, can you give it to me?';

export default class MfaRequest extends Flow<string> {
    protected override init() {
        const mfaModal = new MfaModal(this.app, this.config)

        this.app.action<BlockAction>(actionId, async ({ack, body}) => {
            await ack()
            if (this.done) {
                return
            }

            await mfaModal
                .apply(body.trigger_id)
                .then(code => code === undefined || this.resolve(code))
                .catch(this.reject)
        })
    }

    async apply(timeoutSeconds: number = 30 * 60): Promise<string> {
        const promise = this.promise(timeoutSeconds * 1000)

        await this.app.client.chat.postMessage({
            channel: this.config.CHANNEL_ID,
            text,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text,
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            action_id: actionId,
                            text: {
                                type: 'plain_text',
                                emoji: true,
                                text: 'Enter code :lock:'
                            },
                        },
                    ],
                },
            ]
        }).catch(this.reject)

        return promise
    }
}
