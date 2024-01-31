# 放射線量測定マップ

[ライブデモ](https://viewer-eyamisplua-an.a.run.app/#7.29/37.114/139.596)

<img width="841" alt="image" src="https://github.com/seotaro/radioactivity-viewer/assets/46148606/960848ee-71a8-4a2e-8d7c-fda7f321b5ba">

### Diagram

![diagram drawio](https://github.com/seotaro/radioactivity-viewer/assets/46148606/a616735f-ef78-4677-a6f5-e5f514726c83)

- 時系列データベース「InfluxDB」を使いたかった
- データベースのインスタンスを立てるのにGoogle Cloud PlatformよりさくらのVPSの方が安かった。
- 計測値 → InfluxDBのfield
- 変更頻度は多くないが計測に関係してくると考えられるもの（座標、高さ、装置種別、...）→ InfluxDBのtag
- 変更頻度は多くなく計測に関係しないと考えられるもの（ステーション名称、お知らせ、...）→ PostgreSQL
- 調整中のステーションは時刻がないが、そのままではInfluxDBで扱えないため取得時刻を入れた
- ガイガー=ミュラー計数管（GM管）で計測しているステーションはmeasEquipSpecEn（=測定装置仕様）がnullだが'Count'という文字列を入れた。

### Install

```bash
yarn
```

### Run

```bash
yarn start
```
