# 中文国际化插件，适用于 vue

### [DEMO](./demo)

### 安装

```
npm install @devops/webpack-i18n-plugin-plus -D
```

```
yarn add @devops/webpack-i18n-plugin-plus -D
```

在项目目录下新建文件夹 ``i18n``，添加对应的语言包文件夹
例如：``i18n/en_US/index.xlsx``；这个文件在配置中会用到，见以下代码：

### webpack plugins 配置

```
// webpack.config.js
const WebpackI18nPlugin = require('@devops/webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
    translation: {
        en_US: [path.resolve(__dirname, './i18n/en_US/index.xlsx')] // 对应的翻译文件
    }
}
plugins: [
  ...
  new WebpackI18nPlugin(i18nConfig),
  ...
]
```

> 注：如果出现编译死循环（未出现则忽略），需要在webpack配置中添加配置忽略对输出目录的热更新

```

config.devServer.watchOptions = {
        ignored: /i18n/
}
```

### vue.config.js 配置

```
const WebpackI18nPlugin = require('@devops/webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
    translation: {
        en_US: [path.resolve(__dirname, './i18n/en_US/index.xlsx')] // 对应的翻译文件
    }
}
module.exports = {
    configureWebpack: {
        plugins: [
            new WebpackI18nPlugin(i18nConfig)
        ]
    }
}

```

### 使用方法|切换语言

> 项目启动后会在对应的语言包文件夹下生成 ``index.js`` 文件，这个文件就是对应语言的语言包

确保语言包最先加载到页面中，中文无需引入语言包
最好是在 ``main.js``中进行引入使用
eg:

```
// 页面入口 main.js
import en_US from '../i18n/en_US/index.js'
import zh_CN from '../i18n/zh_CN/index.js'
const langMap = {
  'en': en_US,
  'zhcn': zh_CN
}
const lang = localStorage.getItem('lang')
window.$i8n.locale(langMap[lang])
// other code

```

切换语言我们只需要修改 ``localStorage``中对应的值，并调用浏览器刷新即可

```
window.location.reload()
```

### 备注

1. 编译结果暴露 `$i8n` `$$i8n` 全局方法
2. 编译后，请关注 `build`输出日志，直到无待翻译数据
3. 如果语言包无法更新，清理node_modules/.cache后重新编译
4. 本插件集成了谷歌翻译，结果可能不准，也可能调用失败。如果对翻译结果不满意或者未生成对应的翻译结果，请前往 ``i18n/`` 下对应语言包的 ``index.xlsx``对翻译结果进行修改。

### License

[MIT License](./LICENSE).
