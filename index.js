//Dependencies
const Puppeteer = require("puppeteer")
const Chalk = require("chalk")
const Fs = require("fs")

//Variables
const Self_Args = process.argv.slice(2)

var DorkyDump_Data = {}
DorkyDump_Data.links = []

//Functions
async function Get_Links(){
    const browser = await Puppeteer.launch({ headless: false, argvs: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36")
    await page.goto(`https://www.bing.com/search?q=${Self_Args.slice(2).join("")}`)

    const page_content = await page.content()

    if(page_content.indexOf("There are no results for") != -1){
        console.log(`${Chalk.grey("[") + Chalk.yellowBright("WARNING") + Chalk.grey("]")} Something went wrong while gathering some links, please try again later.`)
        console.log(`${Chalk.grey("[") + Chalk.blueBright("INFO") + Chalk.grey("]")} Aborting..`)
        browser.close()
        process.exit()
        return
    }

    var page_index = 1

    await page.waitForSelector("#b_results > li> h2 > a").catch(()=>{
        console.log(`${Chalk.grey("[") + Chalk.yellowBright("WARNING") + Chalk.grey("]")} Something went wrong while gathering some links, please try again later.`)
        console.log(`${Chalk.grey("[") + Chalk.blueBright("INFO") + Chalk.grey("]")} Aborting..`)
        browser.close()
        process.exit()
        return
    })

    const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
        return elems.map(elem => elem.getAttribute("href"))
    })

    for( i in links ){
        DorkyDump_Data.links.push(links[i])
    }

    page_index += 1

    Repeater()
    async function Repeater(){
        await page.click(`#b_results > li.b_pag > nav > ul > li:nth-of-type(${page_index}) > a`).catch(()=>{
            console.log(`${Chalk.grey("[") + Chalk.yellowBright("WARNING") + Chalk.grey("]")} Max page detected, aborting links gatherer.`)
            console.log(`${Chalk.grey("[") + Chalk.blueBright("INFO") + Chalk.grey("]")} ${DorkyDump_Data.links.length} links has been gathered. Continuing to phase 2.`)
            browser.close()
            D()
            return
        })
        await page.waitForSelector("#b_results > li> h2 > a")

        const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
            return elems.map(elem => elem.getAttribute("href"))
        })
    
        for( i in links ){
            DorkyDump_Data.links.push(links[i])
        }

        if(page_index == Self_Args[0]){
            console.log(`${Chalk.grey("[") + Chalk.blueBright("INFO") + Chalk.grey("]")} ${DorkyDump_Data.links.length} links has been gathered. Continuing to phase 2.`)
            await browser.close()
            D()
            return
        }
    
        page_index += 1

        Repeater()
        return
    }
}

function D(){
    var links = ""

    for( i in DorkyDump_Data.links ){
        if(links.lengh == 0){
            links = DorkyDump_Data.links[i]
        }else{
            links += `\n${DorkyDump_Data.links[i]}`
        }
    }

    Fs.writeFileSync(Self_Args[1], links, "utf8")
    console.log("Done!")
}

//Main
if(Self_Args.length == 0){
    console.log(`node index.js <max_page> <output> <dork>
Example: node index.js 2 ./test_output.txt Dork: "Index of" "upload_image.php"`)
    process.exit()
}

if(Self_Args[0] == ""){
    console.log(`${Chalk.grey("[") + Chalk.redBright("ERROR") + Chalk.grey("]")} Invalid max_page.`)
    process.exit()
}

if(isNaN(Self_Args[0])){
    console.log(`${Chalk.grey("[") + Chalk.redBright("ERROR") + Chalk.grey("]")} max_page is not an Int.`)
    process.exit()
}

if(Self_Args[1] == ""){
    console.log(`${Chalk.grey("[") + Chalk.redBright("ERROR") + Chalk.grey("]")} Invalid output.`)
    process.exit()
}

if(Self_Args[2] == ""){
    console.log(`${Chalk.grey("[") + Chalk.redBright("ERROR") + Chalk.grey("]")} Invalid dork.`)
    process.exit()
}

console.log(`${Chalk.grey("[") + Chalk.blueBright("INFO") + Chalk.grey("]")} Dorking has started.`)
Get_Links()
