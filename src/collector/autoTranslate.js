const { reject } = require('core-js/fn/promise');
const translate = require('@devops/google-translate-api');
const langeKey = {
  en_US: 'en'
}
module.exports = async function autoTranslate(list, tranKey) {
    // function sleep(time) {
    //     return new Promise(reslove => {
    //         setTimeout(() => {
    //             reslove()
    //         }, time)
    //     })
    // }
    // for(let i=0;i<list.length;i++) {
    //     await sleep(100)
    //     const {text} = await translate(list[i].cn, { from:'zh-CN', to: langeKey[tranKey] || tranKey });
    //     list[i].text = text
    // }
    // return list
    return new Promise((reslove, reject) => {
        Promise.all(list.map(async item => {
            const {text} = await translate(item.cn, { from:'zh-CN', to: langeKey[tranKey] || tranKey });
            item.text = text
        })).then(() => {
            reslove(list)
        }).catch(err => {
            reject(err)
        })
    })
}
