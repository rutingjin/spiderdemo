import Filter from './filters'
import { readFileSync } from 'fs'
import path from 'path'


const nodes: SSRNode[] = JSON.parse(
    readFileSync(
        path.resolve(__dirname, '../data/testdata.json')
    ).toString()
)

const filter = new Filter(nodes)

filter.check().then(data => {
    console.log(data)
})
