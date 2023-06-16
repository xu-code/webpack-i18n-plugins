// const translate = require('./deelp');
// const langeKey = {
//   en_US: 'en'
// }
// module.exports = async function autoTranslate(list, tranKey) {
//     // function sleep(time) {
//     //     return new Promise(reslove => {
//     //         setTimeout(() => {
//     //             reslove()
//     //         }, time)
//     //     })
//     // }
//     // for(let i=0;i<list.length;i++) {
//     //     await sleep(100)
//     //     const {text} = await translate(list[i].cn, { from:'zh-CN', to: langeKey[tranKey] || tranKey });
//     //     list[i].text = text
//     // }
//     // return list
//     return new Promise((reslove, reject) => {
//         Promise.all(list.map(async item => {
//             const text = await translate(item.cn, 'zh', 'en');
//             item.text = text
//         })).then(() => {
//             reslove(list)
//         }).catch(err => {
//             reject(err)
//         })
//     })
// }
const tunnel = require('tunnel')
const {translate} = require('@vitalets/google-translate-api')

const googleTranslator = (text) => translate(
    text,
    { from: 'zh-CN',
        to: 'en',
        fetchOptions:   {
            agent: tunnel.httpsOverHttp({
            proxy: {
                host: '127.0.0.1',// 代理 ip
                port: 7890, // 代理 port
                headers: {
                'User-Agent': 'Node'
                }
            }
            })
        }
    },

)
// 定义翻译方法
module.exports = function translateRun(list) {
    return new Promise(async reslove => {
        let chunkValuesLength = 0
        let chunk = []
        const chunks = []
        const sourceKeyValues = list
        sourceKeyValues.forEach((item) => {
            // Google 翻译单次最大字符长度 5000 字, 5 为占位分隔符长度
            if (chunkValuesLength + item.cn.length + 5 >= 5000) {
            chunks.push(chunk)
            chunkValuesLength = 0
            chunk = []
            } else {
            chunk.push(item)
            chunkValuesLength += (item.cn.length + 5)
            }
        })
        if (chunk.length > 0) {// 遍历完后检查不满 5000 字符的遗留
            chunks.push(chunk)
            chunkValuesLength = 0
            chunk = []
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const mergeText = chunk.map(v => v.cn).join('\n###\n')// 合并文案
            const { text } = await googleTranslator(mergeText)
            const resultValues = text.split(/\n *# *# *# *\n/).map((v) => v.trim())// 拆分文案
            if (chunk.length !== resultValues.length) {
            throw new Error('翻译前文案碎片长度和翻译后的不一致')
            }
            chunk.forEach((item, index) => {
                item.text = resultValues[index]
            })
        }
        reslove(list)
    })
}

