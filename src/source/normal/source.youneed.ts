import request from "request"
import cheerio from 'cheerio'
import { decodeSSRLink } from '../../utils'

const uri:string = 'https://www.youneed.win/free-ssr'

const headers:object = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
}

export default function ():Promise<SSRNode[]> {
    return new Promise<SSRNode[]>((resolve, reject) => {
        const result: string[] = []
        request(uri, { headers }, (error, response, body) => {
            if (error) {
                reject(new Error(`
                    Make sure you put the following configuration in your host configuration
                    23.95.215.189 www.youneed.win
                    If you have already set it up, but still can't access it, it may be that the site has disappeared.
                    `))
            } else {
                const $ = cheerio.load(body)
                const list = $('#container #post-box .context table tbody tr')
                if (list.length === 0) {
                    reject(new Error('The page data is empty or the page structure has changed.'))
                }
                for (let i = 0, len = list.length; i < len; i++) {
                    const a = list.eq(i).find('td').eq(0).find('a')
                    result.push(a.attr('href'))
                }
                resolve(decodeSSRLink(result))
            }
        })
    })
}
