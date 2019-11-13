interface recodeCenter {
    [propName: string]: boolean
}

export default function (array: SSRNode[]): SSRNode[] {
    const container:recodeCenter = {}
    const result:SSRNode[] = []
    array.forEach(node => {
        let {server, server_port, password, method, protocol, obfs} = node
        let key = `${server}-${server_port}-${password}-${method}-${protocol}-${obfs}`
        if (!container[key]) {
            container[key] = true
            result.push(node)
        }
    })
    return result
}
