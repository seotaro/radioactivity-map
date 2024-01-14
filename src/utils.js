export const loadImage = (map, name, url) => {
    return new Promise((resolve, reject) => {
        map.loadImage(url, (err, image) => {
            if (err) {
                reject(err);
            }

            map.addImage(name, image, { sdf: true });
            resolve();
        });
    });
}

// LineLayer の緯線経線データを返す。
export const latlonlineGeoJson = (() => {
    const d = 1;  // [°]。
    const dlon = 10;  // [°]。
    const dlat = 10;  // [°]。

    const geojson = {
        type: "FeatureCollection",
        features: [],
    };

    // 経線
    for (let lon = 180; -180 < lon; lon -= dlon) {
        const coordinates = [];
        for (let lat = -80; lat <= 80; lat += d) {
            coordinates.push([lon, lat]);
        }

        const feature = {
            type: "Feature",
            id: geojson.features.length,
            geometry: { type: 'LineString', coordinates: coordinates },
            properties: {},
            info: `${Math.abs(lon)}°${(lon < 0) ? 'W' : 'E'}`
        };
        geojson.features.push(feature);
    }

    // 緯線
    for (let lat = -80; lat < 90; lat += dlat) {
        const coordinates = [];
        for (let lon = -180; lon <= 180; lon += d) {
            coordinates.push([lon, lat]);
        }

        const feature = {
            type: "Feature",
            id: geojson.features.length,
            geometry: { type: 'LineString', coordinates: coordinates },
            properties: {},
            info: `${Math.abs(lat)}°${(lat < 0) ? 'S' : 'N'}`
        };
        geojson.features.push(feature);
    }

    return geojson;
})();



export const hsvToRgb = (H, S, V) => {
    var C = V * S;
    var Hp = H / 60;
    var X = C * (1 - Math.abs(Hp % 2 - 1));

    var R, G, B;
    if (0 <= Hp && Hp < 1) { [R, G, B] = [C, X, 0] };
    if (1 <= Hp && Hp < 2) { [R, G, B] = [X, C, 0] };
    if (2 <= Hp && Hp < 3) { [R, G, B] = [0, C, X] };
    if (3 <= Hp && Hp < 4) { [R, G, B] = [0, X, C] };
    if (4 <= Hp && Hp < 5) { [R, G, B] = [X, 0, C] };
    if (5 <= Hp && Hp < 6) { [R, G, B] = [C, 0, X] };

    var m = V - C;
    [R, G, B] = [R + m, G + m, B + m];

    R = Math.floor(R * 255);
    G = Math.floor(G * 255);
    B = Math.floor(B * 255);

    return [R, G, B];
}

export const toRgb = (array) => {
    return `rgb(${array[0]}, ${array[1]}, ${array[2]})`;
}

// ゼロパディング
export const padding = (value, digit) => {
    return (Array(digit).join('0') + value).slice(-digit);
}

export const PREFECTURES = {
    '01': '北海道',
    '02': '青森県',
    '03': '岩手県',
    '04': '宮城県',
    '05': '秋田県',
    '06': '山形県',
    '07': '福島県',
    '08': '茨城県',
    '09': '栃木県',
    '10': '群馬県',
    '11': '埼玉県',
    '12': '千葉県',
    '13': '東京都',
    '14': '神奈川県',
    '15': '新潟県',
    '16': '富山県',
    '17': '石川県',
    '18': '福井県',
    '19': '山梨県',
    '20': '長野県',
    '21': '岐阜県',
    '22': '静岡県',
    '23': '愛知県',
    '24': '三重県',
    '25': '滋賀県',
    '26': '京都府',
    '27': '大阪府',
    '28': '兵庫県',
    '29': '奈良県',
    '30': '和歌山県',
    '31': '鳥取県',
    '32': '島根県',
    '33': '岡山県',
    '34': '広島県',
    '35': '山口県',
    '36': '徳島県',
    '37': '香川県',
    '38': '愛媛県',
    '39': '高知県',
    '40': '福岡県',
    '41': '佐賀県',
    '42': '長崎県',
    '43': '熊本県',
    '44': '大分県',
    '45': '宮崎県',
    '46': '鹿児島県',
    '47': '沖縄県',
}