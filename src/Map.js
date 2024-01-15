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
  const [lng, setLng] = useState(139.712);
  const [lat, setLat] = useState(36.039);
  const [zoom, setZoom] = useState(8);
  const [isLoading, setLoading] = useState(false);
  const [lastModifiedRadioactivity, setLastModifiedRadioactivity] = useState(false);  // GeoJSON の lastModified
  const [count, setCount] = useState(false);  // GeoJSON の 地物数

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'std-mono.json',
      // style: 'std.json',
      center: [lng, lat],
      zoom: zoom,
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
          // null のプロパティーは queryRenderedFeatures で返ってこないので便宜上 'null' に置き換えて扱う。
          data.features.forEach(feature => {
            Object.keys(feature.properties)
              .filter(key => (feature.properties[key] === null))
              .forEach(key => feature.properties[key] = 'null');
          });

          // airDoseRate（放射線量）を降順でソートする。
          data.features.sort((a, b) => {
            return ((a.properties.airDoseRate === 'null') ? 0.0 : a.properties.airDoseRate) - ((b.properties.airDoseRate === 'null') ? 0.0 : b.properties.airDoseRate);
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
            id: 'radioactivity-layer',
            type: 'circle',
            source: 'radioactivity',
            paint: {
              'circle-radius': 6,
              'circle-stroke-color': 'gray',
              'circle-stroke-opacity': OPACITY,
              'circle-stroke-width': 1,
              'circle-color': makeCircleColor(),
              'circle-opacity': OPACITY,
            }
          });

          setLastModifiedRadioactivity(data.lastModified);
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

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      // feature にカーソルがあれば十字に変える。
      map.current.on('mousemove', (e) => {
        const layers = [];
        if (map.current.getLayer('radioactivity-layer')) layers.push('radioactivity-layer');

        const features = map.current.queryRenderedFeatures(e.point, { layers });
        map.current.getCanvas().style.cursor = features.length ? 'crosshair' : '';
      });

      // クリックした feature のプロパティーをポップアップで表示する。
      map.current.on('click', async (e) => {
        popup.remove();

        if (!map.current.getLayer('radioactivity-layer')) return;

        let contents = [];

        // 放射線量
        if (map.current.getLayer('radioactivity-layer')) {
          const features = map.current.queryRenderedFeatures(e.point,
            { layers: ['radioactivity-layer'] }
          );
          if (0 < features.length) {
            for (let i = 0; i < features.length; i++) {
              contents.push(`<h1>選択中のモニタリングポスト No.${i + 1}</h1>`);

              const feature = features[i];

              contents.push('<table>');
              contents.push('<tbody>');
              contents.push(`<tr><td class='key'>地点名称</td><td class='value'><ruby>${feature.properties.obsStationName}<rp>(</rp><rt>${feature.properties.obsStationNameKana}</rt><rp>)</rp></ruby></td></tr>`);

              const airDoseRate = (() => {
                if (feature.properties.measEquipSpec === 'シーベルト' || feature.properties.measEquipSpec === 'グレイ') {
                  return `${feature.properties.airDoseRate}<span class='unit'>μSv/h</span>`;
                }

                if (feature.properties.countingRate !== 'null') {
                  return `${feature.properties.countingRate}<span class='unit'>cps</span>`;
                }

                return '不明';
              })();
              contents.push(`<tr><td class='key'>空間線量率</td><td class='value'>${airDoseRate}</td></tr>`);

              contents.push(`<tr><td class='key'>測定日時</td><td class='value'>${moment(feature.properties.measEndDatetime).format()}</td></tr>`);
              contents.push(`<tr><td class='key'>装置種別</td><td class='value'>${POP_DEVICE_KBN[feature.properties.popDeviceKbn].name}</td></tr>`);
              contents.push(`<tr><td class='key'>測定装置仕様</td><td class='value'>${feature.properties.measEquipSpec}</td></tr>`);
              contents.push(`<tr><td class='key'>標高</td><td class='value'>${(feature.properties.altitude === 'null') ? '−' : feature.properties.altitude}<span class='unit'>m</span></td></tr>`);
              contents.push(`<tr><td class='key'>地上からの高さ</td><td class='value'>${(feature.properties.measAltitude === 'null') ? '−' : feature.properties.measAltitude * 100}<span class='unit'>cm</span></td></tr>`);

              const limit = (() => {
                const measRangeLowLimit = (feature.properties.measRangeLowLimit === 'null') ? '−' : feature.properties.measRangeLowLimit;
                const measRangeHighLimit = (feature.properties.measRangeHighLimit === 'null') ? '−' : feature.properties.measRangeHighLimit;
                return `${measRangeLowLimit}<span class='unit'>μSv/h</span> 〜 ${measRangeHighLimit}<span class='unit'>μSv/h</span>`;
              })();
              contents.push(`<tr><td class='key'>測定範囲</td><td class='value'>${limit}</td></tr>`);

              const wind = (() => {
                if (feature.properties.weatherSensorFlg === '0') {
                  return '−';
                }
                if (feature.properties.weatherSensorFlg === '1') {
                  const windDirectionCodeName = (feature.properties.windDirectionCodeName === 'null') ? '−' : feature.properties.windDirectionCodeName;
                  const windSpeed = (feature.properties.windSpeed === 'null') ? '−' : feature.properties.windSpeed;
                  return `${windDirectionCodeName}, ${windSpeed}<span class='unit'>m/s<span>`;
                }
                return '不明';
              })();
              contents.push(`<tr><td class='key'>風向・風速</td><td class='value'>${wind}</td></tr>`);

              contents.push('</tbody>');
              contents.push('</table>');

              {
                const newsList = feature.properties.newsMapDisp.split('\r\n').reverse();
                contents.push('<div class="news-contents">');
                contents.push(`<span class='key'>お知らせ</span>`);
                contents.push('<ul class="news-list">');
                newsList.forEach(news => {
                  contents.push(`<li class='news-item'><span >${news}</span></li>`);
                });
                contents.push('</ul>');
                contents.push('</div>');
              }
            }
          }
        }

        if (0 < contents.length) {
          popup.setLngLat(e.lngLat)
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

  return [mapContainer, isLoading, lastModifiedRadioactivity, count];
};

export default useMap;

const makeCircleColor = () => {
  let circleColor = null;
  circleColor = ["case",
    // 調整中
    ['all',
      ['==', ['get', 'airDoseRate'], 'null'],
      ['==', ['get', 'countingRate'], 'null']
    ], toRgb([180, 180, 180]),

    // 下限未達
    ['all',
      ['!=', ['get', 'measRangeLowLimit'], 'null'],
      ['<', ['get', 'airDoseRate'], ['get', 'measRangeLowLimit']]
    ], toRgb([0, 255, 255]),

    // 上限超過
    ['all',
      ['!=', ['get', 'measRangeHighLimit'], 'null'],
      ['<', ['get', 'measRangeHighLimit'], ['get', 'airDoseRate']]
    ], toRgb([255, 0, 255]),
  ];

  AIR_DOSE_RATE_MOD_KEYS.forEach(key => {
    circleColor.push(["<", Number(key), ["get", "airDoseRate"]], toRgb(AIR_DOSE_RATE_MOD[key].color));
  });
  circleColor.push("rgb(255, 0, 255)");// デフォルト値

  return circleColor;
}
