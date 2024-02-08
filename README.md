# 放射線量測定マップ

[ライブデモ](https://radioactivity-123456.web.app/#8/36.039/139.712)

<img width="841" alt="image" src="https://github.com/seotaro/radioactivity-map/assets/46148606/960848ee-71a8-4a2e-8d7c-fda7f321b5ba">

### Diagram

![diagram drawio](https://github.com/seotaro/radioactivity-map/assets/46148606/a616735f-ef78-4677-a6f5-e5f514726c83)

- 時系列データベース「InfluxDB」を使いたかった
- データベースのインスタンスを立てるのにGoogle Cloud PlatformよりさくらのVPSの方が安かった。
- 計測値（countingRate or airDoseRate）とrangeFlg（下限未達='under', 範囲内='normal', 上限超過='over', 値なし='missing'） → InfluxDBのfield。
- ステーションの情報（ステーション名称、座標、高さ、装置種別、お知らせ、...）→ PostgreSQL
- ガイガー=ミュラー計数管（GM管）で計測しているステーションはmeasEquipSpecEn（=測定装置仕様）がnullだが'Count'という文字列を入れた。

### Install

```bash
yarn
```

### Run

```bash
yarn start
```
