import { hsvToRgb } from './utils';

// 装置種別
export const POP_DEVICE_KBN = {
  '4': { color: hsvToRgb(360 * 0 / 13, 0.8, 1), name: 'サーベイメータ(空間線量率)', },
  '5': { color: hsvToRgb(360 * 1 / 13, 0.8, 1), name: 'サーベイメータ(中性子線量率)', },
  '11': { color: hsvToRgb(360 * 2 / 13, 0.8, 1), name: '固定観測局(自治体)', },
  '12': { color: hsvToRgb(360 * 3 / 13, 0.8, 1), name: '固定観測局(水準調査用)', },
  '14': { color: hsvToRgb(360 * 4 / 13, 0.8, 1), name: '電子式線量計局 ', },
  '15': { color: hsvToRgb(360 * 5 / 13, 0.8, 1), name: '固定観測局(リアルタイム線量測定システム(福島調査用))', },
  '16': { color: hsvToRgb(360 * 6 / 13, 0.8, 1), name: '可搬型モニタリングポスト(国／自治体)', },
  '17': { color: hsvToRgb(360 * 7 / 13, 0.8, 1), name: '可搬型モニタリングポスト(代替可搬)', },
  '18': { color: hsvToRgb(360 * 8 / 13, 0.8, 1), name: '固定観測局(福島及び隣接調査用)', },
  '19': { color: hsvToRgb(360 * 9 / 13, 0.8, 1), name: '固定観測局(国・水準調査用)', },
  '20': { color: hsvToRgb(360 * 9 / 13, 0.8, 1), name: '固定観測局(原子力艦用)', },
  '23': { color: hsvToRgb(360 * 10 / 13, 0.8, 1), name: '固定観測局(原子力艦、海水計)', },
  '24': { color: hsvToRgb(360 * 11 / 13, 0.8, 1), name: '走行サーベイ', },
}

export const WEATHER_SENSOR_FLG = {
  '0': { color: hsvToRgb(360 * 0 / 2, 0.8, 1), name: '気象センサーなし or 調整中', },
  '1': { color: hsvToRgb(360 * 1 / 2, 0.8, 1), name: '気象センサーあり', },
}

// 測定装置仕様
export const MEAS_EQUIP_SPEC = {
  'シーベルト': { color: hsvToRgb(360 * 0 / 2, 0.8, 1), name: 'シーベルト', },
  'グレイ': { color: hsvToRgb(360 * 1 / 2, 0.8, 1), name: 'グレイ', },
}

// 空間線量率（放射線モニタリング情報共有・公表システムと同じ配色）
export const AIR_DOSE_RATE = {
  '0.001': { color: [20, 255, 255], name: '0.001' },
  '0.5': { color: [20, 255, 20], name: '0.5' },
  '20': { color: [255, 240, 0], name: '20' },
  '500': { color: [255, 0, 0], name: '500' },
}

// 降順でソート
export const AIR_DOSE_RATE_KEYS = Object.keys(AIR_DOSE_RATE)
  .sort((a, b) => {
    return a < b ? 1 : -1;
  });


// 空間線量率 mod
const gradation = (pos) => {
  const startHue = 120.0; // [°]
  const endHue = 0.0;     // [°]
  const hue = startHue * (1.0 - pos) + endHue * pos;  // [°]
  const saturation = 1.0;
  const lightness = 1.0;
  return hsvToRgb(hue, saturation, lightness);
}
export const AIR_DOSE_RATE_MOD = {
  '0.001': { color: gradation(0 / 11), name: '0.001' },
  '0.005': { color: gradation(1 / 11), name: '0.005' },
  '0.01': { color: gradation(2 / 11), name: '0.01' },
  '0.05': { color: gradation(3 / 11), name: '0.05' },
  '0.1': { color: gradation(4 / 11), name: '0.1' },
  '0.5': { color: gradation(5 / 11), name: '0.5' },
  '1.0': { color: gradation(6 / 11), name: '1.0' },
  '5.0': { color: gradation(7 / 11), name: '5.0' },
  '10.0': { color: gradation(8 / 11), name: '10.0' },
  '50.0': { color: gradation(9 / 11), name: '50.0' },
  '100': { color: gradation(10 / 11), name: '100' },
  '500': { color: gradation(11 / 11), name: '500' },
  // '1000': { color: gradation( 7 / 10), name: '1000' },
}

// 降順でソート
export const AIR_DOSE_RATE_MOD_KEYS = Object.keys(AIR_DOSE_RATE_MOD)
  .sort((a, b) => {
    return Number(a) < Number(b) ? 1 : -1;
  });
