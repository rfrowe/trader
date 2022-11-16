import {Flow} from "../index";

const callbackId = 'mfa:modal'

export default class MfaModal extends Flow<string | undefined> {
    protected override init() {
        this.app.view({
            callback_id: callbackId,
            type: 'view_submission',
        }, async ({ack, body}) => {
            await ack()

            const code = body.view.state.values?.mfa?.code?.value
            if (code === undefined || code === null) {
                this.reject('received empty response')
            } else {
                console.log('received code', code)
                this.resolve(code)
            }
        })
        this.app.view({
            callback_id: callbackId,
            type: 'view_closed',
        }, async ({ack}) => {
            await ack()

            this.resolve(undefined)
        })
    }

    async apply(triggerId: string): Promise<string | undefined> {
        const promise = this.promise()

        await this.app.client.views.open({
            trigger_id: triggerId,
            view: {
                type: 'modal',
                callback_id: callbackId,
                notify_on_close: true,
                title: {
                    type: 'plain_text',
                    emoji: true,
                    text: 'SMS MFA Code',
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'mfa',
                        label: {
                            type: 'plain_text',
                            emoji: true,
                            text: 'Code',
                        },
                        element: {
                            type: 'number_input',
                            action_id: 'code',
                            focus_on_load: true,
                            is_decimal_allowed: false,
                            placeholder: {
                                type: 'plain_text',
                                emoji: false,
                                text: '000000',
                            },
                        },
                    }
                ],
                submit: {
                    type: 'plain_text',
                    emoji: true,
                    text: 'Submit',
                },
            }
        }).catch(e => this.reject(`failed to open MFA modal: ${e}`))

        return promise
    }
}
