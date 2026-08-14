# mediaPlayer MultiPlatform

`mediaPlayer` 多端版第一阶段工程骨架。

## 技术路线

```text
Quasar / Vue / TypeScript 统一业务工程
+
Electron 负责 PC 端
+
Capacitor 负责 Android 手机 / Android Pad
+
播放器、下载、文件能力通过平台 adapter 接入
```

## 当前阶段

第一阶段：多端骨架验证。

已完成：

- Quasar + Vue 3 + TypeScript 项目创建
- Pinia 状态管理接入
- Electron 模式接入
- Capacitor 模式接入
- Android 平台目录创建
- 播放页骨架
- 手机 / Pad 响应式布局基础
- 平台 adapter 目录和统一接口占位
- SPA 构建验证
- Electron 构建验证
- Android Web 资源同步验证

待后续阶段接入：

- 原 PC 项目的本地文件选择能力
- 原 PC 项目的下载能力
- HLS / DASH 播放库
- Android 文件选择
- Android 下载管理
- Android 横竖屏控制
- 必要时接 Android Media3 / ExoPlayer

## 常用命令

```bash
npm run dev
npm run typecheck
npm run build:spa
npm run dev:electron
npm run build:electron
npm run dev:android
npm run build:android
```

## 打包说明

PC 桌面端：

```bash
npm run build:electron
```

H5：

```bash
npm run build:spa
```

Android 手机 / Android Pad：

```bash
npm run build:android
```

Android 打包需要本机安装并配置：

- JDK
- `JAVA_HOME`
- Android SDK
- Gradle 可用环境

当前环境已完成 Capacitor Android 工程创建和 web assets 同步，APK 打包最后一步阻塞在 `JAVA_HOME is not set`。
