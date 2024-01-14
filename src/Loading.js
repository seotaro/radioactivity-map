import ReactLoading from 'react-loading';
import Box from '@mui/material/Box';

// ローディング画像
export const Loading = ({ isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', }}>
        <ReactLoading color={'gray'} type={'spin'} />
      </Box>
    )
  }

  return null;
}