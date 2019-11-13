import request from "request"
import cheerio from 'cheerio'
import { decodeSSRLink } from '../utils'

const uri:string = 'https://23.95.215.189/free-ssr'

const headers:object = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
}

export default function ():Promise<SSRNode[]> {
    return new Promise<SSRNode[]>((resolve, reject) => {
        const result: string[] = []
        request(uri, { headers }, (error, response, body) => {
            if (error) {
                reject(error)
            }
            const $ = cheerio.load(body)
            const list = $('#container #post-box .context table tbody tr')
            if (list.length === 0) {
                reject(new Error('页面SSR数据为空或者页面结构发生变化'))
            }
            for (let i = 0, len = list.length; i < len; i++) {
                const a = list.eq(i).find('td').eq(0).find('a')
                result.push(a.attr('href'))
            }
            resolve(decodeSSRLink(result))
        })
    })
}
