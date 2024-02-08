import { useState, useEffect, useRef } from 'react';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import moment from 'moment';

import {
  POP_DEVICE_KBN,
  AIR_DOSE_RATE_MOD,
  AIR_DOSE_RATE_MOD_KEYS,
} from './define'
import { loadImage, toRgb } from './utils';

const RADIOACTIVITY_API_URL = process.env.REACT_APP_RADIOACTIVITY_API_URL || 'http://localhost:8080';

const OPACITY = 0.8;

export const useMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [lng, setLng] = useState(139.712);
  const [lat, setLat] = useState(36.039);
  const [zoom, setZoom] = useState(8);
  const [isLoading, setLoading] = useState(false);
  const [count, setCount] = useState(false);  // GeoJSON の 地物数

  const isSmartphoneRef = useRef(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'std-mono.json',
      // style: 'std.json',
      center: [lng, lat],
      zoom: zoom,
      minZoom: 4,
      maxZoom: 15,
      pitch: 0,
      hash: true,
    });

    map.current.on('load', async () => {
      setLoading(true);

      fetch(RADIOACTIVITY_API_URL)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 放射線量を降順でソートする。測定単位が cps のものも合わせてソートする。
          data.features.sort((a, b) => {

            //  rangeFlg: -1=下限未達, 0=範囲内, 1=上限超過, null=値なし

            const x = (() => {
              if (a.properties.fugaFlg === 'missing') return 0.0;
              if (a.properties.fugaFlg === 'under') return 0.0;
              if (a.properties.fugaFlg === 'over') return a.properties.measRangeHighLimit;
              return a.properties.value;
            })();

            const y = (() => {
              if (b.properties.fugaFlg === 'missing') return 0.0;
              if (b.properties.fugaFlg === 'under') return 0.0;
              if (b.properties.fugaFlg === 'over') return b.properties.measRangeHighLimit;
              return b.properties.value;
            })();

            return x - y;
          });

          // null のプロパティーは queryRenderedFeatures で返ってこないので便宜上 'null' に置き換えて扱う。
          data.features.forEach(feature => {
            Object.keys(feature.properties)
              .filter(key => (feature.properties[key] === null))
              .forEach(key => feature.properties[key] = 'null');
          });

          return data;
        })
        .then(data => {
          map.current.addSource('radioactivity', {
            type: 'geojson',
            data,
            attribution: '<a href="https://www.erms.nsr.go.jp/nra-ramis-webg/" target="_blank">「放射線モニタリング情報共有・公表システム」（原子力規制委員会）を加工して作成</a>',
          });

          map.current.addLayer({
            id: 'radioactivity-countingrate-layer',
            type: 'circle',
            source: 'radioactivity',
            filter: ['==', ['get', 'measEquipSpecEn'], 'Count'],
            paint: {
              'circle-radius': 6,
              'circle-stroke-color': 'gray',
              'circle-stroke-opacity': OPACITY,
              'circle-stroke-width': 1,
              'circle-color': makeCountingRateCircleColor(),
              'circle-opacity': OPACITY,
            }
          });

          map.current.addLayer({
            id: 'radioactivity-airdoserate-layer',
            type: 'circle',
            source: 'radioactivity',
            filter: ['!=', ['get', 'measEquipSpecEn'], 'Count'],
            paint: {
              'circle-radius': 6,
              'circle-stroke-color': 'gray',
              'circle-stroke-opacity': OPACITY,
              'circle-stroke-width': 1,
              'circle-color': makeAirDoseRateCircleColor(),
              'circle-opacity': OPACITY,
            }
          });

          setCount(data.features.length);
          setLoading(false);
        })
        .catch(error => {
          console.log('Fetch error: ' + error.message);
        });

      // fill pattern 用のイメージを読み込む。
      {
        const patterns = [
          { name: 'wide-upward-diagonal-black', url: './images/wide-upward-diagonal-black.png' },
          { name: 'percent-10', url: './images/percent-10.png' },
          { name: 'large-grid', url: './images/large-grid.png' },
          { name: 'wind-arrow', url: './images/baseline_navigation_black_48dp.png' },
          { name: 'wind-calm', url: './images/baseline_circle_black_24dp.png' },
        ];

        await Promise.all(patterns.map(pattern => {
          return loadImage(map.current, pattern.name, pattern.url)
            .catch((error) => {
              console.error(error)
            })
        }));
      }

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      popup.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      // feature にカーソルがあれば十字に変える。
      map.current.on('mousemove', (e) => {
        const layers = [];
        if (map.current.getLayer('radioactivity-airdoserate-layer')) layers.push('radioactivity-airdoserate-layer');
        if (map.current.getLayer('radioactivity-countingrate-layer')) layers.push('radioactivity-countingrate-layer');

        const features = map.current.queryRenderedFeatures(e.point, { layers });
        map.current.getCanvas().style.cursor = features.length ? 'crosshair' : '';
      });

      // クリックした feature のプロパティーをポップアップで表示する。
      map.current.on('click', async (e) => {
        popup.current.remove();

        const layers = [];
        if (map.current.getLayer('radioactivity-airdoserate-layer')) layers.push('radioactivity-airdoserate-layer');
        if (map.current.getLayer('radioactivity-countingrate-layer')) layers.push('radioactivity-countingrate-layer');

        if (layers.length === 0) return;

        let contents = [];

        // 放射線量
        const features = map.current.queryRenderedFeatures(e.point, { layers });
        if (0 < features.length) {
          for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            if (isSmartphoneRef.current) {
              contents.push(`<h1>No.${i + 1}</h1>`);
              contents.push(...makePopupForSmartphone(feature));
            } else {
              contents.push(`<h1>選択中のモニタリングポスト No.${i + 1}</h1>`);
              contents.push(...makePopup(feature));
            }
          }
        }

        if (0 < contents.length) {
          popup.current.setLngLat(e.lngLat)
            .setHTML(contents.join(''))
            .addTo(map.current);
        }
      });
    });

    return () => {
      map.current.remove();
      map.current = null;
    }
  }, []);

  const setSmartphone = (isSmartphone = true) => {
    isSmartphoneRef.current = isSmartphone;

    if (popup.current) {
      popup.current.remove();
    }
  }

  return [mapContainer, isLoading, count, { setSmartphone }];
};

export default useMap;

const makeAirDoseRateCircleColor = () => {
  let circleColor = null;
  circleColor = ["case",
    ['==', ['get', 'fugaFlg'], 'missing'], toRgb([180, 180, 180]),  // 調整中
    ['==', ['get', 'fugaFlg'], 'under'], toRgb([0, 255, 255]),        // 下限未達
    ['==', ['get', 'fugaFlg'], 'over'], toRgb([255, 0, 255]),         // 上限超過
  ];

  AIR_DOSE_RATE_MOD_KEYS.forEach(key => {
    circleColor.push(["<", Number(key), ["get", "value"]], toRgb(AIR_DOSE_RATE_MOD[key].color));
  });
  circleColor.push("rgb(64, 64, 64)");  // デフォルト値

  return circleColor;
}

const makeCountingRateCircleColor = () => {
  // 単位が cps のものは閾値が不明...がとりあえず放置する。
  let circleColor = null;
  circleColor = ["case",
    ['==', ['get', 'fugaFlg'], 'missing'], toRgb([180, 180, 180]),  // 調整中
  ];
  circleColor.push("rgb(64, 64, 64)");// デフォルト値
  return circleColor;
}

const makePopup = (feature) => {
  const contents = [];

  contents.push('<table>');
  contents.push('<tbody>');
  contents.push(`<tr><td class='key'>id</td><td class='value'>${feature.properties.obsStationId}</td></tr>`);
  contents.push(`<tr><td class='key'>地点名称</td><td class='value'><ruby>${feature.properties.obsStationName}<rp>(</rp><rt>${feature.properties.obsStationNameKana}</rt><rp>)</rp></ruby></td></tr>`);

  const airDoseRate = (() => {
    if (feature.properties.fugaFlg === 'missing') {
      return '（調整中）';
    }

    let value = '';
    switch (feature.properties.fugaFlg) {
      case 'over': value = `（上限超過）`; break;
      case 'under': value = `（下限未達）`; break;
      case 'normal': value = `${feature.properties.value}`; break;
    }

    switch (feature.properties.measEquipSpecEn) {
      case 'Sievert':
      case 'Gray':
        return `${value}<span class='unit'>μSv/h</span>`;

      case 'Count':
        return `${value}<span class='unit'>cps</span>`;
    }

    return '不明';
  })();
  contents.push(`<tr><td class='key'>空間線量率</td><td class='main-value'>${airDoseRate}</td></tr>`);

  const measEndDatetime = (() => {
    if (feature.properties.fugaFlg === 'missing') {
      return '（調整中）';
    }
    return moment(feature.properties.measEndDatetime).format();
  })();
  contents.push(`<tr><td class='key'>測定日時</td><td class='value'>${measEndDatetime}</td></tr>`);
  contents.push(`<tr><td class='key'>装置種別</td><td class='value'>${POP_DEVICE_KBN[feature.properties.popDeviceKbn].name}</td></tr>`);
  contents.push(`<tr><td class='key'>測定装置仕様</td><td class='value'>${(feature.properties.measEquipSpecEn === 'null') ? '不明' : feature.properties.measEquipSpecEn}</td></tr>`);
  contents.push(`<tr><td class='key'>標高</td><td class='value'>${(feature.properties.altitude === 'null') ? '−' : feature.properties.altitude}<span class='unit'>m</span></td></tr>`);
  contents.push(`<tr><td class='key'>地上からの高さ</td><td class='value'>${(feature.properties.measAltitude === 'null') ? '−' : feature.properties.measAltitude * 100}<span class='unit'>cm</span></td></tr>`);

  const limit = (() => {
    const measRangeLowLimit = (feature.properties.measRangeLowLimit === 'null') ? '−' : feature.properties.measRangeLowLimit;
    const measRangeHighLimit = (feature.properties.measRangeHighLimit === 'null') ? '−' : feature.properties.measRangeHighLimit;
    return `${measRangeLowLimit}<span class='unit'>μSv/h</span> 〜 ${measRangeHighLimit}<span class='unit'>μSv/h</span>`;
  })();
  contents.push(`<tr><td class='key'>測定範囲</td><td class='value'>${limit}</td></tr>`);

  // const wind = (() => {
  //   if (feature.properties.weatherSensorFlg === '0') {
  //     return '−';
  //   }
  //   if (feature.properties.weatherSensorFlg === '1') {
  //     const windDirectionCodeName = (feature.properties.windDirectionCodeName === 'null') ? '−' : feature.properties.windDirectionCodeName;
  //     const windSpeed = (feature.properties.windSpeed === 'null') ? '−' : feature.properties.windSpeed;
  //     return `${windDirectionCodeName}, ${windSpeed}<span class='unit'>m/s<span>`;
  //   }
  //   return '不明';
  // })();
  // contents.push(`<tr><td class='key'>風向・風速</td><td class='value'>${wind}</td></tr>`);

  contents.push('</tbody>');
  contents.push('</table>');

  {
    const newsList = feature.properties.newsMapDisp.split('\r\n').reverse();
    contents.push('<div class="news-contents">');
    contents.push(`<span class='key'>お知らせ</span>`);
    contents.push('<ul class="news-list">');
    newsList.forEach(news => {
      contents.push(`<li class='news-item'>${news}</li>`);
    });
    contents.push('</ul>');
    contents.push('</div>');
  }

  return contents;
};


const makePopupForSmartphone = (feature) => {
  const contents = [];

  contents.push('<ul>');
  contents.push(`<li class='value'><ruby>${feature.properties.obsStationName}<rp>(</rp><rt>${feature.properties.obsStationNameKana}</rt><rp>)</rp></ruby></li>`);

  const airDoseRate = (() => {
    if (feature.properties.fugaFlg === 'missing') {
      return '（調整中）';
    }

    switch (feature.properties.measEquipSpecEn) {
      case 'Sievert':
      case 'Gray':
        return `${feature.properties.value}<span class='unit'>μSv/h</span>`;

      case 'Count':
        return `${feature.properties.value}<span class='unit'>cps</span>`;
    }

    return '不明';
  })();
  contents.push(`<li class='value'>${airDoseRate}</li>`);

  const measEndDatetime = (() => {
    if (feature.properties.fugaFlg === 'missing') {
      return '（調整中）';
    }
    return moment(feature.properties.measEndDatetime).format();
  })();
  contents.push(`<li class='value'>${measEndDatetime}</li>`);

  contents.push('</ul>');
  return contents;
};
