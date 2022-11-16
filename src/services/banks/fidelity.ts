import playwright, {Browser, Page} from "playwright"
import {BuyOrder, SellOrder, TradeAction, TradeOrder} from "../../models/trade";
import {error} from "../../utils";
import Brokerage from "./brokerage";
import SlackBot from "../interfaces/slack";
import Interface from "../interfaces/interface";

const Endpoints = {
    TRADE: "https://digital.fidelity.com/ftgw/digital/trade-equity/index/orderEntry",
    LOGIN: "https://digital.fidelity.com/prgw/digital/login/full-page",
    PORTFOLIO: "https://oltx.fidelity.com/ftgw/fbc/oftop/portfolio",
    SECURITY_CODE: "https://login.fidelity.com/cas/login/RtlCust",
}

export default class Fidelity extends Brokerage {
    override readonly name: string = "Fidelity"

    private _browser: Browser | undefined

    private async browser(): Promise<Browser> {
        if (this._browser === undefined) {
            this._browser = await playwright.firefox.launch({
                headless: false,
                env: {},
                args: []
            })
        }

        return this._browser
    }

    private _page: Page | undefined

    private async page(notifier: Interface): Promise<Page> {
        if (this._page === undefined) {
            const browser = await this.browser()

            this._page = await browser.newPage()
            await Fidelity.login(this._page, notifier)
        }

        return this._page
    }

    private static readonly USERNAME_KEY = 'FIDELITY_USERNAME'
    private static readonly PASSWORD_KEY = 'FIDELITY_PASSWORD'
    private static readonly ACCOUNT_KEY = 'FIDELITY_ACCOUNT'

    private static get USERNAME(): string {
        return process.env[Fidelity.USERNAME_KEY] || error(`${Fidelity.USERNAME_KEY} not specified in environment`)
    }

    private static get PASSWORD(): string {
        return process.env[Fidelity.PASSWORD_KEY] || error(`${Fidelity.PASSWORD_KEY} not specified in environment`)
    }

    private static get ACCOUNT(): string {
        return process.env[Fidelity.ACCOUNT_KEY] || error(`${Fidelity.ACCOUNT_KEY} not specified in environment`)
    }

    private static async login(page: Page, notifier: Interface) {
        await page.goto(Endpoints.LOGIN)

        const usernameBox = await page.getByRole('textbox', {name: 'Username'})
        await usernameBox.click()
        await usernameBox.fill(Fidelity.USERNAME)

        const passwordBox = await page.getByRole('textbox', {name: 'Password'})
        await passwordBox.click()
        await passwordBox.fill(Fidelity.PASSWORD)

        await page.getByRole('button', {name: 'Log In'}).click()
        await page.waitForURL(url => {
            switch (url.origin + url.pathname) {
                case Endpoints.PORTFOLIO:
                case Endpoints.SECURITY_CODE:
                    return true
                default:
                    return false
            }
        })

        const url = new URL(page.url())
        switch (url.origin + url.pathname) {
            case Endpoints.PORTFOLIO:
                return
            case Endpoints.SECURITY_CODE:
                return this.twoFactorCode(page, notifier)
            default:
                error('Failed to login or reach two factor auth page')
        }
    }

    private static async twoFactorCode(page: Page, notifier: Interface) {
        const url = new URL(page.url())
        if (url.origin + url.pathname != Endpoints.SECURITY_CODE) {
            console.log('Mistakenly entered 2FA routine')
            return
        }

        await page.waitForSelector('text=Extra security step required')
        const button = page.locator('button:text("Continue")')
        const position = (await button.boundingBox())!

        // This is gross, see if there's another way
        const [x, y] = [position.x + position.width / 2, position.y + position.height / 2]
        await page.mouse.move(x, y, {steps: 100})
        await page.mouse.down()
        await page.waitForTimeout(Math.random() * 200 + 200)
        await page.mouse.up()

        const code = await notifier.getTwoFactorCode()
        console.log('typing code', code)

        const box = page.locator('#security-code')
        await box.click()
        await box.type(code)
        await page.press('body', 'Enter')

        await page.waitForURL(url => url.origin + url.pathname === Endpoints.PORTFOLIO)
    }

    async buy(trade: BuyOrder, notifier: Interface): Promise<boolean> {
        const page = await this.page(notifier)

        await page.goto(Fidelity.urlForTrade(trade))

        await page.waitForTimeout(5000)
        await page.click('text="Dollars"')
        await page.type('#eqt-shared-quantity', trade.amount.toString())
        await page.click('text="Market"')
        await page.click('text="Preview order"')

        const preview = page.locator('.eq-ticket__preview__trade-details-selections')
        const screenshot = await preview.screenshot()

        const approved = await notifier.proposeTrade({
            trade,
            reason: "rebalance your portfolio",
            proof: screenshot,
        })

        console.log(`trade is ${approved ? 'approved' : 'rejected'}`)

        return approved
    }

    async sell(trade: SellOrder): Promise<boolean> {
        throw new Error('selling at Fidelity is not implemented')
    }

    private static urlForTrade(trade: TradeOrder<any>): string {
        const url = new URL(Endpoints.TRADE)

        const params = url.searchParams
        params.set('ACCOUNT', Fidelity.ACCOUNT)
        params.set('ORDER_ACTION', Fidelity.orderActionForTrade(trade))
        params.set('SYMBOL', trade.asset)

        return url.toString()
    }

    private static orderActionForTrade(trade: TradeOrder<any>): string {
        switch (trade.action) {
            case TradeAction.BUY:
                return 'B'
            case TradeAction.SELL:
                return 'S'
            default:
                error(`Fidelity does not support trade type ${trade.action.name}`)
        }
    }
}