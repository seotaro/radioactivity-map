import { useState, useEffect, useRef } from 'react';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import moment from 'moment';

import {
  POP_DEVICE_KBN,
  WEATHER_SENSOR_FLG,
  MEAS_EQUIP_SPEC,
  AIR_DOSE_RATE,
  AIR_DOSE_RATE_KEYS,
  AIR_DOSE_RATE_MOD,
  AIR_DOSE_RATE_MOD_KEYS,
} from './define'
import { loadImage, toRgb } from './utils';

const RADIOACTIVITY_API_URL = process.env.REACT_APP_RADIOACTIVITY_API_URL || 'http://localhost:8080';
const AMEDAS_API_URL = process.env.REACT_APP_AMEDAS_API_URL || 'http://localhost:8080';

const OPACITY = 0.8;

export const useMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(139.712);
  const [lat, setLat] = useState(36.039);
  const [zoom, setZoom] = useState(8);
  const [isLoading, setLoading] = useState(false);
  const [lastModifiedRadioactivity, setLastModifiedRadioactivity] = useState(false);  // GeoJSON の lastModified
  const [lastModifiedAmedas, setLastModifiedAmedas] = useState(false);  // AMeDAS の lastModified
  const [count, setCount] = useState(false);  // GeoJSON の 地物数

  const [legend, _setLegend] = useState('airDoseRate');
  const [isShowAmedas, _showAmedas] = useState(false);

  const legendRef = useRef('airDoseRate');
  const isShowAmedasRef = useRef(false);

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

      fetch(AMEDAS_API_URL)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {

          setLastModifiedAmedas(data.datetime);

          map.current.addSource('amedas', {
            type: 'geojson',
            data: data,
            attribution: '<a href="https://www.jma.go.jp/bosai/map.html/" target="_blank">気象庁「アメダス」を加工して作成</a>',
          });

          map.current.addLayer({
            id: 'amedas-wind-layer',
            type: 'symbol',
            source: 'amedas',
            filter: ['==', ['get', 'isWind'], true],
            layout: {
              visibility: isShowAmedasRef.current ? 'visible' : 'none',
              'icon-allow-overlap': true,
              'icon-anchor': 'center',
              'icon-image': ['case',
                ['==', ['get', 'windSpeed'], null], 'wind-calm', // 休止中
                ['>', ['get', 'windSpeed'], 0.4], 'wind-arrow',
                'wind-calm' // 静穏
              ],
              'icon-size': 0.6,
              'icon-rotate': ['case',
                ['==', ['get', 'windDirection'], null], 0, // 休止中
                ['get', 'windDirection']
              ],
            },
            paint: {
              'icon-halo-color': 'black',
              'icon-halo-width': 2.8,
              'icon-color': ['case',
                ['==', ['get', 'windSpeed'], null], '#888', // 休止中
                ['<', ['get', 'windSpeed'], 5.0], '#e5e5ff', // 気象庁の 'rgb(242, 242, 255)' から変更した
                ['<', ['get', 'windSpeed'], 10.0], 'rgb(0, 65, 255)',
                ['<', ['get', 'windSpeed'], 15.0], 'rgb(250, 245, 0)',
                ['<', ['get', 'windSpeed'], 20.0], 'rgb(255, 153, 0)',
                ['<', ['get', 'windSpeed'], 25.0], 'rgb(255, 40, 0)',
                'rgb(180, 0, 104)'
              ],
              'icon-opacity': OPACITY,
            }
          });
        });


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
              'circle-stroke-opacity': isShowAmedasRef.current ? 0.25 : OPACITY,
              'circle-stroke-width': 1,
              'circle-color': makeCircleColor(legendRef.current),
              'circle-opacity': isShowAmedasRef.current ? 0.25 : OPACITY,
            }
          }, map.current.getLayer('amedas-wind-layer') ? 'amedas-wind-layer' : null);

          // map.current.setLayoutProperty('radioactivity-layer', 'visibility', 'none');

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
        if (map.current.getLayer('amedas-wind-layer')) layers.push('amedas-wind-layer');

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
              contents.push(`<h1>Radioactivity No.${i + 1}</h1>`);

              const feature = features[i];
              contents.push('<ul>');
              Object.keys(feature.properties)
                .sort((a, b) => {
                  return a < b ? -1 : 1;
                })
                .map(key => contents.push(
                  `<li key=${key}>
                    <span class='key'>${key}:</span>
                    <span class='value'>${(() => {
                    if (feature.properties[key] == null) return '';

                    // 時刻表記はローカルのタイムゾーンで表示する。
                    if (key === 'measEndDatetime') {
                      return moment(feature.properties[key]).format();
                    }
                    return feature.properties[key];
                  })()}
                    </span>
                  </li>`
                ))
              contents.push('</ul>');
            }
          }
        }

        // アメダス
        if (map.current.getLayer('amedas-wind-layer')) {
          const features = map.current.queryRenderedFeatures(e.point,
            { layers: ['amedas-wind-layer'] }
          );
          if (0 < features.length) {
            for (let i = 0; i < features.length; i++) {
              contents.push(`<h1>AMeDAS No.${i + 1}</h1>`);

              const feature = features[i];
              contents.push('<ul>');
              Object.keys(feature.properties)
                .map(key => contents.push(
                  `<li key=${key}>
                    <span class='key'>${key}:</span>
                    <span class='value'>${feature.properties[key]}</span>
                  </li>`
                ))
              contents.push('</ul>');
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

  const setLegend = (_legend) => {
    legendRef.current = _legend;
    _setLegend(_legend);

    if (!map.current?.getLayer('radioactivity-layer')) return;
    map.current.setPaintProperty('radioactivity-layer', 'circle-color', makeCircleColor(_legend));
  }

  const showAmedas = (_isShow) => {
    isShowAmedasRef.current = _isShow;
    _showAmedas(_isShow);

    if (!map.current?.getLayer('amedas-wind-layer')) return;
    map.current.setLayoutProperty('amedas-wind-layer', 'visibility', _isShow ? 'visible' : 'none');

    if (map.current?.getLayer('radioactivity-layer')) {
      map.current.setPaintProperty('radioactivity-layer', 'circle-opacity', _isShow ? 0.25 : OPACITY);
      map.current.setPaintProperty('radioactivity-layer', 'circle-stroke-opacity', _isShow ? 0.25 : OPACITY);
    }
  }

  return [mapContainer, isLoading, lastModifiedRadioactivity, lastModifiedAmedas, count, legend, isShowAmedas, { setLegend, showAmedas }];
};

export default useMap;

const makeCircleColor = (legend) => {
  let circleColor = null;
  switch (legend) {
    case 'popDeviceKbn':
      circleColor = ['match', ['get', 'popDeviceKbn'],];
      Object.entries(POP_DEVICE_KBN).forEach(([key, value]) => {
        circleColor.push(key, toRgb(value.color));
      });
      circleColor.push('rgb(255, 0, 255)'); // デフォルト色
      break;

    case 'weatherSensorFlg':
      circleColor = ['match', ['get', 'weatherSensorFlg'],];
      Object.entries(WEATHER_SENSOR_FLG).forEach(([key, value]) => {
        circleColor.push(key, toRgb(value.color));
      });
      circleColor.push('rgb(255, 0, 255)'); // デフォルト色
      break;

    case 'measEquipSpec':
      circleColor = ['match', ['get', 'measEquipSpec'],];
      Object.entries(MEAS_EQUIP_SPEC).forEach(([key, value]) => {
        circleColor.push(key, toRgb(value.color));
      });
      circleColor.push('rgb(255, 0, 255)'); // デフォルト色
      break;

    case 'airDoseRate':
      circleColor = ["case",
        // 調整中
        ['==', ['get', 'airDoseRate'], 'null'], toRgb([180, 180, 180]),

        // 下限未達
        ['all',
          ['!=', ['get', 'measRangeLowLimit'], 'null'],
          ['<', ['get', 'airDoseRate'], ['get', 'measRangeLowLimit']]
        ], toRgb([255, 255, 255]),

        // 上限超過
        ['all',
          ['!=', ['get', 'measRangeHighLimit'], 'null'],
          ['<', ['get', 'measRangeHighLimit'], ['get', 'airDoseRate']]
        ], toRgb([172, 63, 255]),
      ];

      AIR_DOSE_RATE_KEYS.forEach(key => {
        circleColor.push(["<", Number(key), ["get", "airDoseRate"]], toRgb(AIR_DOSE_RATE[key].color));
      });

      circleColor.push("rgb(255, 0, 255)");// デフォルト値
      break;

    case 'airDoseRate-mod':
      circleColor = ["case",
        // 調整中
        ['==', ['get', 'airDoseRate'], 'null'], toRgb([180, 180, 180]),

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
      break;

    default:
      circleColor = 'rgb(255, 0, 255)';
      break;
  }

  return circleColor;
}
