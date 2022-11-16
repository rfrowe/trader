import {error} from "../../../utils";
import * as dotenv from 'dotenv'

dotenv.config()

export interface Config {
    readonly BOT_TOKEN: string
    readonly CHANNEL_ID: string
    readonly LISTENER_PORT: number
    readonly SIGNING_SECRET: string
    readonly USER_TOKEN: string
}

const Keys: Record<keyof Config, string> = {
    BOT_TOKEN: 'SLACK_BOT_TOKEN',
    CHANNEL_ID: 'SLACK_CHANNEL_ID',
    LISTENER_PORT: 'SLACK_LISTENER_PORT',
    SIGNING_SECRET: 'SLACK_SIGNING_SECRET',
    USER_TOKEN: 'SLACK_USER_TOKEN',
}

function resolveKey(key: string): string {
    return process.env[key] || error(`${key} not specified in environment`)
}

function resolveIntKey(key: string): number {
    const value = resolveKey(key)
    const number = parseInt(value)
    if (isNaN(number)) {
        error(`${key} must have integer value but is ${value}`)
    }

    return number
}

const Config: Config = {
    BOT_TOKEN: resolveKey(Keys.BOT_TOKEN),
    CHANNEL_ID: resolveKey(Keys.CHANNEL_ID),
    LISTENER_PORT: resolveIntKey(Keys.LISTENER_PORT),
    SIGNING_SECRET: resolveKey(Keys.SIGNING_SECRET),
    USER_TOKEN: resolveKey(Keys.USER_TOKEN),
}

export default Config
