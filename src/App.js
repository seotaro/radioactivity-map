import React, { useEffect } from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { useSearchParams } from "react-router-dom";
import moment from 'moment';

import useMap from './Map';
import {
  POP_DEVICE_KBN,
  WEATHER_SENSOR_FLG,
  MEAS_EQUIP_SPEC,
  AIR_DOSE_RATE,
  AIR_DOSE_RATE_KEYS,
  AIR_DOSE_RATE_MOD,
  AIR_DOSE_RATE_MOD_KEYS,
} from './define'
import { toRgb } from './utils'
import { Loading } from './Loading';


const LEGENDS = [
  'popDeviceKbn',     // 装置種別
  'weatherSensorFlg', // 気象センサー有無
  'measEquipSpec',    // 測定装置仕様
  'airDoseRate',      // 空間線量率
  'airDoseRate-mod',  // 空間線量率
];

const SETTINGS = {
  initialViewState: {
    longitude: 140.0,
    latitude: 37.0,
    zoom: 7.5,
  },
  mapLayer: {
    color: [64, 64, 64],
    url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson'
  },
  backgroundLayer: {
    color: [32, 32, 32]
  },
  latlonLineLayer: {
    color: [127, 127, 127]
  },
  radioActivityLayer: {
    color: [255, 127, 127]
  },
  latlonGridLayer: {
    color: [127, 255, 127]
  },
  highlight: {
    color: [255, 127, 127, 127]
  },
};

const Legend = (props) => {
  const {
    lastModifiedRadioactivity,
    lastModifiedAmedas,
    count,
    legend,
    isShowAmedas,
    onChangeLegend,
    onChangeAmedas
  } = props;

  const items = [];
  switch (legend) {
    case 'popDeviceKbn':
      items.push(...Object.keys(POP_DEVICE_KBN)
        .map(key => { return { name: `${key}: ${POP_DEVICE_KBN[key].name}`, color: POP_DEVICE_KBN[key].color } })
      );
      break;

    case 'weatherSensorFlg':
      items.push(...Object.keys(WEATHER_SENSOR_FLG)
        .map(key => { return { name: `${key}: ${WEATHER_SENSOR_FLG[key].name}`, color: WEATHER_SENSOR_FLG[key].color } })
      );
      break;

    case 'measEquipSpec':
      items.push(...Object.keys(MEAS_EQUIP_SPEC)
        .map(key => { return { name: `${MEAS_EQUIP_SPEC[key].name}`, color: MEAS_EQUIP_SPEC[key].color } })
      );
      break;

    case 'airDoseRate':
      // 降順でソート
      items.push({ code: null, name: '（上限超過）', color: [172, 63, 255] });
      items.push(...AIR_DOSE_RATE_KEYS.map(key => {
        return { name: AIR_DOSE_RATE[key].name, color: AIR_DOSE_RATE[key].color }
      }));
      items.push({ code: null, name: '（下限未達）', color: [255, 255, 255] });
      items.push({ code: null, name: '（調整中）', color: [180, 180, 180] });
      break;

    case 'airDoseRate-mod':
      // 降順でソート
      items.push({ code: null, name: '上限超過', color: [255, 0, 255] });
      items.push(...AIR_DOSE_RATE_MOD_KEYS.map(key => {
        return { name: AIR_DOSE_RATE_MOD[key].name, color: AIR_DOSE_RATE_MOD[key].color }
      }));
      items.push({ code: null, name: '（下限未達）', color: [0, 255, 255] });
      items.push({ code: null, name: '（調整中）', color: [180, 180, 180] });
      break;
  }
  items.push({ code: null, name: '（その他）', color: [255, 0, 255] });

  const _onChange = (event) => {
    const legend = LEGENDS[event.target.value];
    onChangeLegend(legend);
  };

  const value = ((legend) => {
    for (let i = 0; i < LEGENDS.length; i++) {
      if (LEGENDS[i] === legend) {
        return i;
      }
    }
    return 0;
  })(legend);

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      width: '350px',
      background: 'rgba(255, 255, 255, 0.8)',
      overflowY: 'scroll',
      zIndex: 1000,
    }}>
      <div className='legend-content'>
        <Stack>
          <Typography variant="h6" sx={{ m: 1, m: 1 }}>放射線量測定マップ プロパティ</Typography>
          <Typography variant="h7" sx={{ mx: 2, my: 0.1, fontSize: 12, color: 'gray' }}>放射線量: {lastModifiedRadioactivity ? moment(lastModifiedRadioactivity).format() : ''}</Typography>
          <Typography variant="h7" sx={{ mx: 2, my: 0.1, fontSize: 12, color: 'gray' }}>モニタリングポスト数: {count ? count : ''}</Typography>
          <Typography variant="h7" sx={{ mx: 2, my: 1, fontSize: 12, color: 'gray' }}>アメダス: {lastModifiedAmedas ? moment(lastModifiedAmedas).format() : ''}</Typography>
        </Stack>

        <FormControlLabel sx={{ mx: 1 }} control={
          <Checkbox checked={isShowAmedas} onChange={(event) => onChangeAmedas(event.target.checked)} />
        } label="アメダス" />

        {/* 凡例選択 */}
        <Box sx={{ m: 1 }}>
          <Typography variant="h7" sx={{ m: 1 }}>プロパティ</Typography>
          <RadioGroup value={value} onChange={_onChange}>
            {LEGENDS.map((legend, index) => {
              return (<FormControlLabel key={index} value={index}
                control={<Radio
                  sx={{ ml: 1.5, mr: 0.5, my: 0, '& .MuiSvgIcon-root': { fontSize: 16 } }}
                />}
                label={<Typography style={{ fontSize: 14 }}>{legend}</Typography>}
              />)
            })}
          </RadioGroup>
        </Box>

        {/* 凡例カラーマップ */}
        <Typography variant="h7" sx={{ m: 1 }}>凡例</Typography>
        <List dense={true}>
          {items.map((item, index) => {
            return (
              <ListItem key={index}>
                <Box variant="outlined" sx={{ my: 0, width: 20, height: 20, bgcolor: toRgb(item.color) }} />
                <ListItemText
                  primary={item.name}
                  sx={{ mx: 1 }}
                  primaryTypographyProps={{ style: { fontSize: 12 } }}
                />
              </ListItem>
            )
          })}
        </List>
      </div>
    </div>
  );
};

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mapContainer, isLoading, lastModifiedRadioactivity, lastModifiedAmedas, count, legend, isShowAmedas, { setLegend, showAmedas }] = useMap();

  useEffect(() => {
    setLegend(searchParams.get('legend') || 'airDoseRate');
    showAmedas(searchParams.get('amedas') === 'true');
  }, []);

  useEffect(() => {
    setLegend(searchParams.get('legend') || 'airDoseRate');
    showAmedas(searchParams.get('amedas') === 'true');
  }, [searchParams]);

  const _setLegend = (legend) => {
    searchParams.set('legend', legend);
    setSearchParams(searchParams);
  }

  const _setAmedas = (isShow) => {
    searchParams.set('amedas', isShow);
    setSearchParams(searchParams);
  }

  return (<>
    {/* マップ */}
    <Box ref={mapContainer} id='map-container' />

    <Loading isLoading={isLoading} />

    <Legend
      lastModifiedRadioactivity={lastModifiedRadioactivity}
      lastModifiedAmedas={lastModifiedAmedas}
      count={count}
      legend={legend}
      isShowAmedas={isShowAmedas}
      onChangeLegend={_setLegend}
      onChangeAmedas={_setAmedas} />
  </>);
}

export default App;
