import request from 'request'
import { decodeSSRLink } from '../../utils'

const uri = 'https://onessr.ml/articles/getArticles'

const formData = {
    offset: 0,
    pageSize: 4,
}

export default function ():Promise<SSRNode[]> {
    return new Promise<SSRNode[]>((resolve, reject) => {
        request({
            uri,
            method: 'POST',
            formData,
            json: true
        }, (error, response, body) => {
            if (error) {
                reject()
            } else {
                const originString = body.data && body.data[0] && body.data[0].articleContent || ''
                const linkList = originString
                    .split('\n')
                    .map((line: string) => {
                        if (line) {
                            let reg:RegExp = /(?<=>)[^<>]+(?=<)/g
                            return line.match(reg)[0]
                        }
                    })
                resolve(decodeSSRLink(linkList))
            }
        })
    })
}
