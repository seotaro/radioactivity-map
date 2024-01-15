import React, { useEffect } from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import moment from 'moment';

import useMap from './Map';
import {
  AIR_DOSE_RATE_MOD,
  AIR_DOSE_RATE_MOD_KEYS,
} from './define'
import { toRgb } from './utils'
import { Loading } from './Loading';


const Legend = (props) => {
  const {
    lastModifiedRadioactivity,
    count,
  } = props;

  const items = [];
  {
    // 降順でソート
    items.push({ code: null, name: '上限超過', color: [255, 0, 255] });
    items.push(...AIR_DOSE_RATE_MOD_KEYS.map(key => {
      return { name: AIR_DOSE_RATE_MOD[key].name, color: AIR_DOSE_RATE_MOD[key].color }
    }));
    items.push({ code: null, name: '（下限未達）', color: [0, 255, 255] });
    items.push({ code: null, name: '（調整中）', color: [180, 180, 180] });
    items.push({ code: null, name: '（その他）', color: [64, 64, 64] });
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      minWidth: '260px',
      background: 'rgba(255, 255, 255, 0.8)',
      overflowY: 'scroll',
      zIndex: 1000,
    }}>
      <div className='legend-content'>
        <Stack>
          <Typography variant="h6" sx={{ m: 1, m: 1 }}>放射線量測定マップ</Typography>
          <Typography variant="h7" sx={{ mx: 2, my: 0.1, fontSize: 12, color: 'gray' }}>放射線量: {lastModifiedRadioactivity ? moment(lastModifiedRadioactivity).format() : ''}</Typography>
          <Typography variant="h7" sx={{ mx: 2, my: 0.1, fontSize: 12, color: 'gray' }}>モニタリングポスト数: {count ? count : ''}</Typography>
        </Stack>

        {/* 凡例カラーマップ */}
        <Box sx={{ m: 1 }} >
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
        </Box>
      </div>
    </div>
  );
};

function App() {
  const [mapContainer, isLoading, lastModifiedRadioactivity, count] = useMap();

  return (<>
    {/* マップ */}
    <Box ref={mapContainer} id='map-container' />

    <Loading isLoading={isLoading} />

    <Legend
      lastModifiedRadioactivity={lastModifiedRadioactivity}
      count={count}
    />
  </>);
}

export default App;
