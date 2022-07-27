"use strict";

//Dependencies
const puppeteer = require("puppeteer")
const chalk = require("chalk")
const fs = require("fs")

//Variables
const args = process.argv.slice(2)

var DorkyDump = {
    links: []
}

//Functions
async function gatherLinks(){
    const browser = await puppeteer.launch({ headless: false, argvs: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36")
    await page.goto(`https://www.bing.com/search?q=${args.slice(2).join("")}`)

    const pageContent = await page.content()

    if(pageContent.indexOf("There are no results for") !== -1){
        console.log(`${chalk.grey("[") + chalk.yellowBright("WARNING") + chalk.grey("]")} Something went wrong while gathering some links, please try again later.`)
        console.log(`${chalk.grey("[") + chalk.blueBright("INFO") + chalk.grey("]")} Aborting..`)
        browser.close()
        process.exit()
    }

    var pageIndex = 1

    await page.waitForSelector("#b_results > li> h2 > a").catch(()=>{
        console.log(`${chalk.grey("[") + chalk.yellowBright("WARNING") + chalk.grey("]")} Something went wrong while gathering some links, please try again later.`)
        console.log(`${chalk.grey("[") + chalk.blueBright("INFO") + chalk.grey("]")} Aborting..`)
        browser.close()
        process.exit()
    })

    const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
        return elems.map(elem => elem.getAttribute("href"))
    })

    for( let i in links ){
        DorkyDump.links.push(links[i])
    }

    pageIndex++

    gather()
    async function gather(){
        await page.click(`#b_results > li.b_pag > nav > ul > li:nth-of-type(${pageIndex}) > a`).catch(()=>{
            console.log(`${chalk.grey("[") + chalk.yellowBright("WARNING") + chalk.grey("]")} Max page detected, aborting links gatherer.`)
            console.log(`${chalk.grey("[") + chalk.blueBright("INFO") + chalk.grey("]")} ${DorkyDump.links.length} links has been gathered.`)
            browser.close()
            return done()
        })
        await page.waitForSelector("#b_results > li> h2 > a")

        const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
            return elems.map(elem => elem.getAttribute("href"))
        })
    
        for( const link of links ) DorkyDump.links.push(link)

        if(pageIndex == args[0]){
            console.log(`${chalk.grey("[") + chalk.blueBright("INFO") + chalk.grey("]")} ${DorkyDump.links.length} links has been gathered.`)
            browser.close()
            return end()
        }
    
        pageIndex++

        gather()
        return
    }
}

function end(){
    fs.writeFileSync(args[1], DorkyDump.links.join("\n"), "utf8")
    console.log("Finished.")
}

//Main
if(!args.length) return console.log("node index.js <maxPage> <output> <dork>")
if(!args[0]) return console.log("Invalid max page.")
if(isNaN(args[0])) return console.log("Max page is not a number.")
if(!args[1]) return console.log("Invalid output.")
if(!args[2]) return console.log("Invalid dork.")

console.log(`${chalk.grey("[") + chalk.blueBright("INFO") + chalk.grey("]")} Dorking has started.`)
gatherLinks()