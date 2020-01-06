import request from 'request'
import CryptoJS from 'crypto-js'

const uri = 'https://lncn.org/api/lncnG'

// const defaultConfig: proxyConfig = {
//     proxy: 'http://127.0.0.1:1080',
// }

interface lncnData {
    ssr: {
        [propName:string]: any
    }
}

export default function ():Promise<SSRNode[]> {
    return new Promise<SSRNode[]>((resolve, reject) => {
        request(
            uri,
            { method: 'POST' },
            (error, response, body) => {
                if (error || !body) {
                    reject(new Error(`
                    Make sure you put the following configuration in your host configuration
                    69.194.14.16 www.lncn.org
                    If you have already set it up, but still can't access it, it may be that the site has disappeared.
                    `))
                } else {
                    const result = JSON.parse(body)
                    const bytes = CryptoJS.AES.decrypt(
                        result.ssrs || '',
                        CryptoJS.enc.Utf8.parse('6512654323254321'),
                        {
                            mode: CryptoJS.mode.ECB,
                            padding: CryptoJS.pad.Pkcs7
                        }
                    )
                    const originList = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                    resolve(originList.map((node:lncnData) => ({
                        remarks: node.ssr.remarks,
                        id: Math.random().toString().replace('0.', Math.random().toString().slice(2, 4)),
                        server: node.ssr.ip,
                        server_port: node.ssr.port,
                        server_udp_port: 0,
                        password: node.ssr.password,
                        method: node.ssr.method,
                        protocol: node.ssr.protocol,
                        protocolparam: node.ssr.protoparam,
                        obfs: node.ssr.obfs,
                        obfsparam: node.ssr.obfsparam,
                        remarks_base64: "",
                        group: node.ssr.group,
                        enable: true,
                        udp_over_tcp: false
                    })))
                }
            }
        )
    })
}
