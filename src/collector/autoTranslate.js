const getOptions = require('../babel-plugin/utils').getOptions
const tunnel = require('tunnel')
const {translate} = require('@vitalets/google-translate-api')
const googleTranslator = (text, tranKey, port = 7890) => translate(
    text,
    { from: 'zh-CN',
        to: tranKey,
        fetchOptions:   {
            agent: tunnel.httpsOverHttp({
            proxy: {
                port, // 代理 port
                host: '127.0.0.1',// 代理 ip
                headers: {
                'User-Agent': 'Node'
                }
            }
            })
        }
    }
)
// 定义翻译方法
module.exports = function translateRun(list, tranKey) {
    // 兼容1.x版本传入的en_US
    const langKeyMap = {
        'en_US': 'en'
    }
    tranKey = langKeyMap[tranKey] || tranKey
    return new Promise(async (reslove, reject) => {
        if(!list.length) {
            reslove(list)
        }
        try {
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
                const port = getOptions('translatePort')
                const { text } = await googleTranslator(mergeText, tranKey, port)
                const resultValues = text.split(/\n *# *# *# *\n/).map((v) => v.trim())// 拆分文案
                if (chunk.length !== resultValues.length) {
                throw new Error('翻译前文案碎片长度和翻译后的不一致')
                }
                chunk.forEach((item, index) => {
                    const translateFormatter = getOptions('translateFormatter') || ((value) => value)
                    item.text = translateFormatter(resultValues[index])
                })
            }
            reslove(list)
        } catch (error) {
            reject({error, list})
        }
    })
}

