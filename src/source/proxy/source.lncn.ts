import request from 'request'
import CryptoJS from 'crypto-js'

const uri = 'https://lncn.org/api/lncn'

const defaultConfig: proxyConfig = {
    proxy: 'http://127.0.0.1:1080',
}

interface lncnData {
    ssr: {
        [propName:string]: any
    }
}

export default function (proxyconfig:proxyConfig = defaultConfig):Promise<SSRNode[]> {
    return new Promise<SSRNode[]>((resolve, reject) => {
        request(
            uri,
            { ...proxyconfig, method: 'POST' },
            (error, response, body) => {
                if (error || !body) {
                    reject()
                }
                const result = JSON.parse(body)
                const bytes = CryptoJS.AES.decrypt(
                    result.ssrs || '',
                    CryptoJS.enc.Utf8.parse('6512654323241236'),
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
        )
    })
}
