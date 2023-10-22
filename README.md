# webpack-i18n-plugin-plus

# 中文国际化插件，适用于 vue，支持ts

### 安装

```bash
npm install @devops/webpack-i18n-plugin-plus @babel/plugin-transform-typescript -D

```

```bash
yarn add @devops/webpack-i18n-plugin-plus @babel/plugin-transform-typescript -D

```

在项目目录下新建文件夹 `i18n`，添加对应的语言包文件夹（注：一个工程对应一个目录，不可共用，否则会相互覆盖
例如：`i18n/en_US/index.xlsx`；这个文件在配置中会用到，见以下代码：

### webpack plugins 配置

```jsx
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

```jsx

config.devServer.watchOptions = {
        ignored: /i18n/
}

```

### vue.config.js 配置

```jsx
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

> 项目启动后会在对应的语言包文件夹下生成 index.js 文件，这个文件就是对应语言的语言包

确保语言包最先被加载到，中文无需引入语言包
**最佳实践：**

```jsx
// i18n.js
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

在main.js中的 **第一行** 将上面的js文件引入

```jsx
// main.js
import './i18n.js'

```

如果需要切换语言我们只需要修改 `localStorage`中对应的值，并调用浏览器刷新即可

```jsx
window.location.reload()

```

### 命名空间

> 如果项目不是单独部署（作为插件/组件被其他项目引入）；为避免语言包冲突，需要定义命名空间。

**在使用上面，仅需要完成两个步骤：**

1. 在webpack配置中加入命名空间的key值：

   ```jsx
   const i18nConfig = {
       i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
       translation: {
           en_US: [path.resolve(__dirname, './i18n/en_US/index.xlsx')] // 对应的翻译文件
       },
       nameSpace: 'vueProject1'
   }

   ```
2. 在注入语言包时，传入命名空间的key值（需与步骤1的key值保持一致）

   ```jsx
   const langMap = {
     'en': en_US,
     'zhcn': zh_CN
   }
   const lang = localStorage.getItem('lang') || 'en'
   window.$i8n.locale(langMap[lang], 'vueProject1')

   ```

### 参数

| 参数          | 说明                                                                                          | 类型           | 默认值                            |
| ------------- | --------------------------------------------------------------------------------------------- | -------------- | --------------------------------- |
| i18nDir       | 国际化配置输出目录                                                                            | string         | path.resolve(__dirname, './i18n') |
| translation   | 语言配置，可通过不同传入的方式来定义翻译的文件、翻译文本的格式化；具体见下                    | object         |                                   |
| nameSpace     | 命名空间                                                                                      | string         |                                   |
| translatePort | 代理端口（科学上网的端口）；用于调用翻译api                                                   | number\|string | string                            |
| tsOptions     | ts文件配置选项，详见https://babel.docschina.org/docs/babel-plugin-transform-typescript/配置项 | object         |                                   |

### translation[key]: string|array|object

- string: `path.resolve(__dirname, './i18n/en_US/index.xlsx')`
- array: `[path.resolve(__dirname, './i18n/en_US/index.xlsx')]`
- object:

```jsx
{
	sourceFiles: string|array,
	formatter: function(value) {} // value: 翻译文本，可对文本做格式化
}
```

eg：

```jsx
translation: {
        en_US: {
          sourceFiles: [path.resolve(__dirname, './i18n/en_US/index.xlsx')],
          formatter: (value) => {
            return value + " "
          }
        } 
    }
```

### 方法

`window.$i8n` 当项目中有相同的中文需要翻译成不同的单词时，提供的自定义翻译解决方法

- **类型：** `(key: string, val: string, nameSpace: string) => string`
- **参数：**
  - key: 关键字对应的key值
  - val: 若语言包中未能取到对应的key值
  - nameSpace: 命名空间，若项目中使用了命名空间，则该参数需要传递
- **示例：**

假设项目中出现两处 **“需求” ,** 需要分别翻译为demand、DEMAND；则其中有一个可以借助插件进行自动翻译，另一个需要自己定义需要翻译的内容，我们以DEMAND为例：

```jsx
// 在项目下定义对应的语言JSON，如
const customLangMap = {
	'en': {
        '需求': 'DEMAND'
	},
    'zhcn': {
        '需求': '需求'
	}
}
// 在注入语言包时，将对应的语言包进行解构
const langMap = {
  'en': en_US,
  'zhcn': zh_CN
}
const lang = localStorage.getItem('lang') || 'en'
window.$i8n.locale({...langMap[lang], ...customLangMap[lang]})

```

```jsx
// 在需要自定义翻译的地方使用$i18n进行包裹
$i8n('需求', '需求', nameSpace) // 对应语言下：需求/DEMAND

```

`window.$$i8n` 当项目中有不需要进行国际化的中文时，可以通过该方法进行跳过

- **类型：** `(value: string) => value: string`
- **参数：**
  - value：原始文案
- **示例：**

```jsx
$$i8n('需求') // 需求

```

### 备注

1. 编译后，可以关注 **终端** 输出日志，查看翻译情况；
2. 本插件集成了谷歌翻译，翻译结果准确性有限，也可能调用失败（本地科学上网端口号指向7890，翻译的成功率更高）。
3. 如果对翻译结果不满意或者未生成对应的翻译结果，可前往 `i18n/` 下对应语言包的 `index.xlsx`对翻译结果进行修改。

### 备注

1. 编译后，可以关注 **终端** 输出日志，查看翻译情况；
2. 本插件集成了谷歌翻译，翻译结果准确性有限，也可能调用失败（本地科学上网端口号指向7890，翻译的成功率更高）。
3. 如果对翻译结果不满意或者未生成对应的翻译结果，可前往 `i18n/` 下对应语言包的 `index.xlsx`对翻译结果进行修改。

### License

[MIT License](./LICENSE).
