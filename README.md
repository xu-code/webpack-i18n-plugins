# webpack-i18n-plugin-plus

# 中文国际化插件2.0，适用于 vue2.x，支持ts

### 从1.x迁移(未使用1.x版本的可直接跳过)

1、直接安装最新版本（注意查看当前最新版本

```
npm install webpack-i18n-plugin-plus@2.x @babel/plugin-transform-typescript -D
or
yarn add webpack-i18n-plugin-plus@2.x @babel/plugin-transform-typescript -D
```

2、安装完成之后，先直接启动项目，插件会将历史的index.xlsx转化为user.json文件。

3、完成步骤1，2之后，可将配置修改为以下(最新版可直接使用key值可直接使用en代替en_US(也可以不做调整)，如果修改对应引入的文件语言包也需要调整)

```javascript
// webpack.config.js
const WebpackI18nPlugin = require('webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录，默认值：path.resolve(__dirname, './i18n')
    translation: {
        en: {},
        port: 7890 // 默认值7890，由于翻译调用的是谷歌翻译api，需要提供科学上网的端口，否则大概率翻译失败
    }
}
plugins: [
  ...
  new WebpackI18nPlugin(i18nConfig)
  ...
]

```



### 安装

```bash
npm install webpack-i18n-plugin-plus @babel/plugin-transform-typescript -D
```

或

```
yarn add webpack-i18n-plugin-plus @babel/plugin-transform-typescript -D
```



### webpack plugins 配置

#### 基础使用

```javascript
// webpack.config.js
const WebpackI18nPlugin = require('webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录，默认值：path.resolve(__dirname, './i18n')
    translation: {
        en: {},
        port: 7890 // 默认值7890，由于翻译调用的是谷歌翻译api，需要提供科学上网的端口，否则大概率翻译失败
    }
}
plugins: [
  ...
  new WebpackI18nPlugin(i18nConfig)
  ...
]

```

> 注：如果出现编译死循环（未出现则忽略，下同），需要在webpack配置中添加配置忽略对输出目录的热更新

```javascript
config.devServer.watchOptions = {
        ignored: /i18n/
}

```

### vue.config.js 配置

#### 基础使用

```jsx
const WebpackI18nPlugin = require('webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
    translation: {
        en: {},
        port: 7890 // 默认值7890，由于翻译调用的是谷歌翻译api，需要提供科学上网的端口，否则大概率翻译失败
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

仅通过以上的简单配置 =》 **项目--启动！！**

你将会看到项目根目录下多出来一个 `i18n` 文件夹，里面文件夹下对应的 `index.js` 就是生成的语言包；

#### 进阶用法

```javascript
const WebpackI18nPlugin = require('webpack-i18n-plugin-plus')
const i18nConfig = {
    i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
    translation: {
        en: {
          userJson: path.resolve(__dirname, './i18n/en/user.json') // 若对翻译结果不满意，可在对应目录下添加user.json文件，格式参照生成的index.json，最终翻译生成的语言包会优先取userJson中的text值；
          formatt: value => value+ ' ' // 译文格式化，此处将翻译结果的末尾都加上了空格，在页面展示会更加友好
        },
        port: 7890 // 默认值7890，由于翻译调用的是谷歌翻译api，需要提供科学上网的端口，否则大概率翻译失败
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
>
> 需要确保语言包最先被加载并注入

**最佳实践：**在项目目录下创建 `i18n.js`

```javascript
// i18n.js
import en from '../i18n/en/index.js'
import zh_CN from '../i18n/zh_CN/index.js'
const langMap = {
  'en': en,
  'zhcn': zh_CN
}
const lang = localStorage.getItem('lang') || 'en'
window.$i8n.locale(langMap[lang]) // 注意是$i8n，不是$i18n
// other code

```

在 `main.js` 中的 **第一行** 将上面的js文件引入

```javascript
// main.js
import './i18n.js'

```

如果需要切换语言我们只需要修改 `localStorage`中对应语言的值，并调用浏览器刷新即可

```javascript
window.location.reload()
```



### 命名空间

> 如果项目不是单独部署（作为插件/组件被其他项目引入（AMD模式））；为避免语言包冲突，需要定义命名空间。

**在使用上面，仅需要完成两个步骤：**

1. 在webpack配置中加入命名空间的key值：

   ```javascript
   const i18nConfig = {
       i18nDir: path.resolve(__dirname, './i18n'), // 国际化配置输出目录
       translation: {
           en: {}
       },
       nameSpace: 'vueProject1'
   }
   
   ```

2. 在注入语言包时，传入命名空间的key值（需与步骤1的key值保持一致）

   ```javascript
   const langMap = {
     'en': en_US,
     'zhcn': zh_CN
   }
   const lang = localStorage.getItem('lang') || 'en'
   window.$i8n.locale(langMap[lang], 'vueProject1')
   
   ```

### 配置参数

| 参数          | 说明                                                         | 类型           | 默认值                            |
| ------------- | ------------------------------------------------------------ | -------------- | --------------------------------- |
| i18nDir       | 国际化配置输出目录                                           | string         | path.resolve(__dirname, './i18n') |
| translation   | 语言配置，可通过不同传入的方式来定义翻译的文件、翻译文本的格式化；具体见下 translation | object         |                                   |
| nameSpace     | 命名空间                                                     | string         |                                   |
| isSync        | 是否同步执行                                                 | string         | true                              |
| translatePort | 代理端口（科学上网的端口）；用于调用翻译api                  | number\|string | 7890                              |
| tsOptions     | ts文件配置选项，详见 [配置项](https://babel.docschina.org/docs/babel-plugin-transform-typescript/ ) | object         |                                   |

### translation[key]: string|array|object

key值对应的语言详见： [ISO-639](https://cloud.google.com/translate/docs/languages?hl=zh-cn)

- string: `path.resolve(__dirname, './i18n/en_US/index.xlsx')`
- array: `[path.resolve(__dirname, './i18n/en_US/index.xlsx')]`
- object：

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

`window.$i8n` 当项目中有相同的中文需要翻译成不同的单词时，提供的自定义翻译解决方法 (🐶注意是**$i8n**)

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

// 在需要自定义翻译的地方使用$i18n进行包裹
$i8n('需求', '需求', nameSpace) // 对应语言下：需求/DEMAND

```

`window.$$i8n` 当项目中有不需要进行国际化的中文时，可以通过该方法进行跳过(🐶注意是**$$i8n**)

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
2. 本插件集成了谷歌翻译，翻译结果准确性有限，也可能调用失败（科学上网端口号默认指向7890，可通过配置port进行修改）。
3. 如果对翻译结果不满意或者未生成对应的翻译结果，可前往 `i18n/` 下对应语言包的 `index.xlsx`对翻译结果进行修改。
4. 若自动翻译提示当前ip调用次数太多，可通过修改代理端口对应的节点来重置。

### License

[MIT License](./LICENSE).