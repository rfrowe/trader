import playwright, {Browser, Page} from "playwright"
import {BuyOrder, SellOrder, TradeAction} from "../models/trade";
import {error} from "../utils";
import Brokerage from "./banks/brokerage";

class Fidelity extends Brokerage {
    private static readonly Endpoints = {
        "TRADE": "https://digital.fidelity.com/ftgw/digital/trade-equity/index/orderEntry",
        "LOGIN": "https://digital.fidelity.com/prgw/digital/login/full-page",
        "PORTFOLIO": "https://oltx.fidelity.com/ftgw/fbc/oftop/portfolio",
        "SECURITY_CODE": "https://login.fidelity.com/cas/login/RtlCust",
    }

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
    private async page(): Promise<Page> {
        if (this._page === undefined) {
            const browser = await this.browser()

            this._page = await browser.newPage()
            await Fidelity.login(this._page)
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

    private static async login(page: Page) {
        await page.goto(Fidelity.Endpoints.LOGIN)

        const usernameBox = await page.getByRole('textbox', { name: 'Username' })
        await usernameBox.click()
        await usernameBox.fill(Fidelity.USERNAME)

        const passwordBox = await page.getByRole('textbox', { name: 'Password' })
        await passwordBox.click()
        await passwordBox.fill(Fidelity.PASSWORD)

        await page.getByRole('button', { name: 'Log In' }).click()
        await page.waitForURL(url => {
            switch (url.origin + url.pathname) {
                case Fidelity.Endpoints.PORTFOLIO:
                case Fidelity.Endpoints.SECURITY_CODE:
                    return true
                default:
                    return false
            }
        })

        const url = new URL(page.url())
        switch (url.origin + url.pathname) {
            case Fidelity.Endpoints.PORTFOLIO:
                return
            case Fidelity.Endpoints.SECURITY_CODE:
                return this.twoFactorCode(page)
            default:
                error('Failed to login or reach two factor auth page')
        }
    }

    private static async twoFactorCode(page: Page) {
        const url = new URL(page.url())
        if (url.origin + url.pathname != Fidelity.Endpoints.SECURITY_CODE) {
            console.log('Mistakenly entered 2FA routine')
            return
        }

        await page.waitForSelector('text=Extra security step required')
        console.log('got to 2fa')

        await page.waitForTimeout(5000)

        const button = page.locator('button:text("Continue")')
        // TODO: this doesn't work :(
        // await page.click('button:text("Continue")')

        // TODO: type in correct code and submit
    }

    async buy(trade: BuyOrder): Promise<boolean> {
        const page = await this.page()

        await page.goto(Fidelity.Endpoints.TRADE)

        // TODO: type in Symbol
        return false;
    }

    async sell(trade: SellOrder): Promise<boolean> {
        throw new Error('selling at Fidelity is not implemented')
    }
}
