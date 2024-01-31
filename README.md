# 放射線量測定マップ

[ライブデモ](https://viewer-eyamisplua-an.a.run.app/#7.29/37.114/139.596)

<img width="841" alt="image" src="https://github.com/seotaro/radioactivity-viewer/assets/46148606/960848ee-71a8-4a2e-8d7c-fda7f321b5ba">

### Diagram

![diagram drawio](https://github.com/seotaro/radioactivity-viewer/assets/46148606/d6ee8db6-5e28-4bcd-bd7d-38f4d8d1923d)

- 時系列データベース「InfluxDB」を使いたかった
- データベースのインスタンスを立てるのにGoogle Cloud PlatformよりさくらのVPSの方が安かった。
- 計測値 → InfluxDBのfield
- 変更頻度は多くないが計測に関係してくると考えられるもの（座標、高さ、装置種別、...）→ InfluxDBのtag
- 変更頻度は多くないが計測に関係しないと考えられるもの（ステーション名称、お知らせ、...）→ ファイル定義（station.json）
- 調整中のステーションは時刻がないがInfluxDBで扱えないため取得時刻を入れた

### Install

```bash
yarn
```

### Run

```bash
yarn start
```
