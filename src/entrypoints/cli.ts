import * as readline from 'node:readline/promises'
import {stdin, stdout} from 'node:process'
import {Asset} from "../models/assets";
import {AccountBalance} from "../models/balance";
import PortfolioBalancer from "../services/balancer";
import {AssetAllocation} from "../models/allocation";

async function parseAssets(reader: readline.Interface, assets: Map<Asset, number>, prompt: string = "") {
    let line = await reader.question(prompt);
    while (line.trim().length !== 0) {
        const [asset, amountStr] = line.trim().split(' ')
        const amount = parseFloat(amountStr)

        assets.set(asset, amount)

        line = await reader.question("")
    }
}

async function main() {
    const reader = readline.createInterface(stdin, stdout)

    const assets = new Map<Asset, number>()
    await parseAssets(reader, assets, "Enter current 🏦 balance as SYM USD, e.g. VTI 123.45\n")
    const currentBalance = new AccountBalance(assets)
    console.log(currentBalance)

    const allocation = new Map<Asset, number>()
    reader.write("Enter desired asset allocation as SYM %, e.g. VTI 100\n")
    for (const asset of currentBalance.keys()) {
        const proportion = await reader.question(`${asset} `)

        allocation.set(asset, parseFloat(proportion.trim()))
    }
    await parseAssets(reader, allocation)
    console.log(allocation)

    for (const asset of allocation.keys()) {
        allocation.set(asset, allocation.get(asset)! / 100)
    }
    const targetAllocation = new AssetAllocation(allocation)
    console.log(targetAllocation)

    const additionalFunds = await reader.question("How much money will be used to rebalance, in USD?\n")
    const balancer = new PortfolioBalancer(currentBalance)

    const trades = balancer.rebalance(targetAllocation, parseFloat(additionalFunds))
    console.log()
    console.log(trades)

    reader.close()
}

if (require.main === module) {
    (async () => {
        await main()
    })()
}
