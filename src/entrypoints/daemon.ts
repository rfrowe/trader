import Fidelity from '../services/banks/fidelity'
import SlackBot from '../services/interfaces/slack'
import cron from 'cron'
import PortfolioBalancer from '../services/balancer'
import {AssetAllocation} from '../models/allocation'
import targetAllocation from '../data/allocation.json'
import {AccountBalance} from "../models/balance";
import {Asset} from "../models/assets";

async function main() {
    const target = AssetAllocation.from(targetAllocation)
    const fidelity = new Fidelity()
    const slack = new SlackBot()
    await slack.start()

    const rebalance = async () => {
        console.log(`beginning portfolio rebalance @ ${new Date().toISOString()}`)

        const account = await fidelity.positions(slack)
        console.log('current asset positions', account)

        const cashAssets = account
            .map((value, asset): [Asset, number] => [asset, value])
            .filter(([asset]) => asset.endsWith('**'))
        const cash = new AccountBalance(new Map(cashAssets))
        console.log('current cash positions', cash)
        console.log(`total cash available for rebalance: ${cash.sum}`)

        const balancer = new PortfolioBalancer(account.only(...target.keys()))
        const trades = balancer.rebalance(target, cash.sum)
        console.log('determined necessary trades', trades)

        // const results = await fidelity.processTrades(slack, ...trades)
        // const successes = results.map(r => Number(r)).reduce((a, b) => a + b)
        // console.log(`performed ${successes}/${results.length} trade(s), ${results.length - successes} failed`)
    }

    const setup = (date: Date) => {
        const job = cron.job({
            start: true,
            cronTime: date,
            onTick: () => {
                try {
                    rebalance()
                } catch (e: any) {
                    console.error(e)
                } finally {
                    job.stop()

                    const next = new Date(date)
                    next.setDate(next.getDate() + 1)

                    setup(next)
                }
            },
        })
    }

    const date = new Date()
    if (date.getHours() > 12) {
        date.setDate(date.getDate() + 1)
    }
    date.setHours(12, 0, 0)
    setup(date)
}

if (require.main === module) {
    (async () => {
        await main()
    })()
}
