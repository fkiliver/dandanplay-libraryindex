# dandanplay-libraryindex

# dandanplay-libraryindex

弹弹play Windows/UWP 客户端远程访问功能的 Web 前端（媒体库浏览与视频播放）

弹弹play 每次更新时会附带此项目 master 分支最新版的 html/js/css 和图片文件。

## 文件说明

### HTML 页面

* `index.html` - 首页，通过 `http://本机ip/` 访问，显示媒体库导航按钮和文件夹列表
* `bangumi.html` - 番剧列表页，显示动画系列的海报网格，支持搜索和快速导航
* `filelist.html` - 文件列表页，浏览本地或远程文件夹中的视频文件
* `video.html` - 视频播放页面，通过 `http://本机ip/web/{视频hash}` 访问，集成弹幕播放器
* `login.html` - 登录页，当启用 web 验证功能时，匿名用户将被重定向到此页面
* `style.sshtml` - 共享 CSS 样式文件，通过 `@Partial['style.sshtml']` 包含在所有页面中

### 资源文件夹

* `js/` - 存放所有 JavaScript 文件（包括第三方库）
* `css/` - 存放所有 CSS 文件和图片资源
* `webfonts/` - 存放 Web 字体文件（Font Awesome 等）

## 测试方法

1. 首先安装弹弹play Windows/UWP版最新版本
2. 点击首页右上角的"远程访问"按钮，启用远程访问功能，启用开发者工具，点击保存设置
3. 将本项目 git clone 到本地文件夹后，把所有文件复制替换到弹弹play 安装文件夹下的 `web` 文件夹中
4. 使用浏览器访问"远程访问"功能中显示的 IP 地址（一般是本机 IP 或者 `127.0.0.1`），如果无法访问请暂时关闭 Windows 防火墙
5. 修改 HTML 文件并保存后，刷新浏览器即可看到变化

## 关于 HTML 文件

⚠️ **重要提示**：项目中的 HTML 文件**不是静态 HTML**，而是服务端模板文件。

弹弹play 使用 [NancyFx](http://nancyfx.org/) 作为 Web 应用服务器，项目中的 HTML 页面会通过 [The Super Simple View Engine (SSVE)](https://github.com/NancyFx/Nancy/wiki/The%20Super%20Simple%20View%20Engine) 进行预处理后输出。

### 模板语法

页面中的以下标识为服务端动态填充部分，**修改时请勿删除或破坏这些标记**：

* `@Model.属性名称` - 访问视图模型的属性
* `@Each.集合名称` / `@EndEach` - 循环遍历集合
* `@Current.属性名称` - 在循环中访问当前项的属性
* `@If.条件` / `@IfNot.条件` / `@EndIf` - 条件渲染
* `@Partial['文件名']` - 包含局部模板（如 `style.sshtml`）
* `@!变量名` - 输出不进行 HTML 编码的内容（谨慎使用）

### 通用视图模型属性

所有页面共享的属性：

* `@Model.WebSiteName` - 网站名称
* `@Model.UserName` - 当前登录的用户名
* `@Model.ServerInfo` - 服务器状态信息
* `@IfNot.IsAnonymous` / `@If.IsAnonymous` - 判断是否为匿名用户

### **index.html** 首页的视图模型

首页显示媒体库导航按钮和文件夹列表。

**文件夹列表：**
* `@If.HasLocalFolderNames` - 是否有本地文件夹
* `@Each.LocalFolderNames` - 循环本地文件夹列表
* `@If.HasRemoteFolderNames` - 是否有远程文件夹
* `@Each.RemoteFolderNames` - 循环远程文件夹列表
* `@Current` - 当前文件夹名称（在循环中）
* `@!Current` - 输出文件夹名称（不进行 HTML 编码，用于 URL）

**视频列表（如果启用显示首页视频列表）：**
* `@Each.VideoFiles` - 循环视频文件列表
* `@Current.Hash` - 视频文件的 Hash 值（用作视频 ID）
* `@Current.Name` - 视频文件名
* `@Current.AnimeId` - 关联的作品 ID
* `@Current.AnimeTitle` - 作品标题
* `@Current.EpisodeId` - 弹幕库 ID
* `@Current.EpisodeTitle` - 剧集标题
* `@Current.Duration` - 视频时长（整数，秒）
* `@Current.DurationText` - 视频时长（格式化文本，如 `24:56`）
* `@Current.Size` - 视频文件大小（整数，Byte）
* `@Current.SizeText` - 视频文件大小（格式化文本，如 `123.45MB`）
* `@Current.LastPlay` - 上次播放时间（格式化文本，如 `今天08:12`、`昨天22:34`）

### **bangumi.html** 番剧列表页的视图模型

番剧列表页以海报网格方式展示动画系列，支持搜索和快速导航。

* `@Model.Title` - 当前列表的标题（如"最近播放"、"最近更新"等）
* `@Model.BangumiListApi` - 获取番剧列表的 API 端点
* `@Model.BangumiDetailsApi` - 获取番剧详情的 API 端点（包含 `{id}` 占位符）

**数据通过 AJAX 加载**，API 返回 JSON 格式的番剧数据数组。点击海报后会通过 AJAX 加载该番剧的剧集列表，并在模态框中显示。

### **filelist.html** 文件列表页的视图模型

文件列表页用于浏览本地或远程文件夹中的视频文件。

* `@Model.Title` - 当前文件夹的标题
* `@Model.FileListApi` - 获取文件列表的 API 端点

**URL 参数：**
* `?type=local&name=文件夹名` - 浏览本地文件夹
* `?type=remote&name=文件夹名&path=子路径` - 浏览远程文件夹
* `?type=nav&name=分类名` - 浏览特殊分类（如"最近收录"、"未识别"、"独立文件"）

**数据通过 AJAX 加载**，API 返回 JSON 格式的文件数据数组。

### **video.html** 播放页的视图模型

视频播放页集成了 DPlayer 弹幕播放器和 SubtitlesOctopus 字幕渲染引擎。

**视频信息：**
* `@Model.Hash` - 当前播放的视频文件的 Hash 值
* `@Model.Id` - 视频 ID（用于弹幕 API）
* `@Model.Video` - 视频流地址
* `@Model.Image` - 视频缩略图地址
* `@Model.AnimeTitle` - 作品标题
* `@Model.EpisodeTitle` - 剧集标题
* `@Model.Color` - 播放器主题颜色（如 `#0099FF`）

**字幕相关：**
* `@If.HasSubtitle` - 是否有字幕文件
* `@Model.SubtitleVtt` - VTT 格式字幕文件地址
* `@Model.SubtitleAss` - ASS/SSA 格式字幕文件地址
* `@Model.SubtitleFont` - 字幕字体文件地址
* `@Each.SubtitleFiles` - 循环字幕文件列表
* `@Current.Name` - 字幕文件名
* `@Current.SafeName` - URL 安全的字幕文件名
* `@If.IsCurrent` - 是否为当前选中的字幕

**弹幕设置：**
* `@Model.DanmakuArea` - 弹幕显示区域高度（CSS 值）
* `@Model.DanmakuDurationCss` - 弹幕滚动时长（CSS 动画值）

**剧集列表：**
* `@Each.VideoFiles` - 循环剧集列表
* `@Current.Id` - 剧集视频 ID
* `@Current.EpisodeTitle` - 剧集标题
* `@Current.FileName` - 文件名
* `@If.IsCurrent` - 是否为当前播放的剧集

**URL 参数：**
* `?id=视频ID` - 指定要播放的视频
* `?subtitle=字幕文件名` - 指定要加载的字幕文件

## 使用的第三方组件

### 核心组件
* **[DPlayer 1.27.0](https://github.com/MoePlayer/DPlayer)** - HTML5 视频播放器，支持弹幕
* **[SubtitlesOctopus](https://github.com/Dador/JavascriptSubtitlesOctopus)** - 高级字幕渲染引擎，支持 ASS/SSA 格式

### UI 框架
* **Bootstrap 5.3.3** - 现代化 UI 框架（用于 bangumi.html、filelist.html、login.html、index.html）
* **Bootstrap 4.0.0** - 旧版 UI 框架（仅用于 video.html，保持与 DPlayer 兼容）
* **Font Awesome 6.5.2** - 图标库

### 工具库
* **jQuery 3.7.1** - DOM 操作库（用于 bangumi.html、filelist.html、login.html、index.html）
* **jQuery 3.2.1** - 旧版本（用于 video.html）
* **lazysizes 5.3.1** - 图片懒加载库

## 开发注意事项

### Bootstrap 版本差异

⚠️ **重要**：不同页面使用不同版本的 Bootstrap：

* `bangumi.html`、`filelist.html`、`login.html`、`index.html` → **Bootstrap 5.3.3**
* `video.html` → **Bootstrap 4.0.0**（为保持与 DPlayer 的兼容性）

在修改组件时需要注意对应的 Bootstrap 版本差异（如类名、组件结构等）。

### AJAX 数据加载模式

`bangumi.html` 和 `filelist.html` 采用混合渲染模式：
1. 页面框架由服务端通过 SSVE 模板引擎渲染
2. 实际数据列表通过 AJAX 从 API 端点动态加载（URL 由 `@Model.xxxApi` 提供）
3. 数据加载完成后通过 JavaScript 动态生成 DOM 元素

### 视频播放器集成

`video.html` 中的 DPlayer 初始化要点：
* 必须在初始化后设置 `crossorigin="use-credentials"` 属性
* 弹幕 API 端点设置为相对路径 `dplayer/`
* SubtitlesOctopus 需要单独初始化，用于渲染 ASS/SSA 格式字幕

### 图片懒加载

使用 lazysizes.js 实现图片懒加载以提升性能：
```html
<img class="lazyload" data-src="实际图片地址.jpg" src="占位图.gif">
```

## 其他相关项目

* [DanDanPlay-PHP](https://github.com/CberYellowstone/DanDanPlay-PHP) - 弹弹play 媒体库的 PHP 实现