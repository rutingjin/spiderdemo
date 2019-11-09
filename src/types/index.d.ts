declare interface SSRNode {
    server: string,
    server_port: string | number,
    password: string,
    method: string,
    protocol: string | null,
    obfs: string | null,
    [propName:string]: any
}

declare interface SSRConfig {
    configs: Array<SSRNode>,
    [propName: string]: any
}

declare interface pingResult {
    pingTime: string | number,
    node: SSRNode
}

declare interface requestResult {
    pingTime: string | number,
    requestTime: string | number,
    node: SSRNode
}
