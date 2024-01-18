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
import { mediaQuery, useMediaQuery } from './useMediaQuery';

const Title = (props) => {
  const { lastModifiedRadioactivity, count } = props;

  return (
    <Box sx={{ m: 1 }} >
      <Stack>
        <Typography variant="h6" sx={{}}>放射線量測定マップ</Typography>
        <Typography variant="h7" sx={{ mx: 1, my: 0.1, fontSize: 12, color: 'gray' }}>放射線量: {lastModifiedRadioactivity ? moment(lastModifiedRadioactivity).format() : ''}</Typography>
        <Typography variant="h7" sx={{ mx: 1, my: 0.1, fontSize: 12, color: 'gray' }}>モニタリングポスト数: {count ? count : ''}</Typography>
      </Stack>
    </Box>
  );
};

const Legend = (props) => {
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
    <Box sx={{ m: 1 }} >
      <Typography variant="h7" sx={{}}>凡例</Typography>
      <List dense={true}>
        {items.map((item, index) => {
          return (
            <ListItem key={index}>
              <Box variant="outlined" sx={{ my: 0, width: 20, height: 20, bgcolor: toRgb(item.color) }} />
              <ListItemText
                primary={item.name}
                sx={{ mx: 1, my: 0 }}
                primaryTypographyProps={{ style: { fontSize: 12 } }}
              />
            </ListItem>
          )
        })}
      </List>
    </Box>
  );
};

function App() {
  const [mapContainer, isLoading, lastModifiedRadioactivity, count, { setSmartphone }] = useMap();
  const isSmartphone = useMediaQuery(mediaQuery.smartphone);

  useEffect(() => {
    setSmartphone(isSmartphone);
  }, [isSmartphone]);

  return (<>
    {/* マップ */}
    <Box ref={mapContainer} id='map-container' />

    <Loading isLoading={isLoading} />

    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(255, 255, 255, 0.8)',
      overflowY: 'scroll',
      zIndex: 1000,
    }}>
      <Stack>
        <Title lastModifiedRadioactivity={lastModifiedRadioactivity} count={count} />
        {!isSmartphone && <Legend />}
      </Stack>
    </div>
  </>);
}

export default App;
