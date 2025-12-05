import * as Location from "expo-location";
import { StatusBar } from 'expo-status-bar';

import { useState, useEffect } from 'react';

import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Dimensions API를 사용하여 현재 디바이스의 화면 크기를 가져옵니다.
// "window"는 현재 앱이 사용할 수 있는 화면 영역을 의미합니다.
// width를 가져와서 SCREEN_WIDTH라는 변수에 할당합니다.
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 안드로이드 상단 상태바 높이 계산 (노치 대응)
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

console.log(SCREEN_WIDTH); // 콘솔에 화면 너비를 출력하여 확인합니다.

const API_KEY = "1490b2d633b088678c93f6148cf42918";

const themes = {
  light: ['#4c669f', '#3b5998', '#192f6a'],
  dark: ['#0f2027', '#203a43', '#2c5364'],
};

const getWeatherIcon = (condition) => {
  switch (condition) {
    case "Clear":
      return "sunny";
    case "Clouds":
      return "cloudy";
    case "Rain":
      return "rainy";
    case "Snow":
      return "snow";
    case "Thunderstorm":
      return "thunderstorm";
    case "Drizzle":
      return "rainy";
    case "Atmosphere":
      return "cloudy-outline";
    default:
      return "partly-sunny";
  }
};

export default function App() {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const theme = darkMode ? themes.dark : themes.light;

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const [city, setCity] = useState("Loading...");
  const [district, setDistrict] = useState("");
  const [todayWeather, setTodayWeather] = useState([]);
  const [futureWeather, setFutureWeather] = useState([]);
  const [ok, setOk] = useState(true);

  const getWeather = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setOk(false);
    }

    const {
      coords: { latitude, longitude },
    } = await Location.getCurrentPositionAsync({ accuracy: 5 });

    const location = await Location.reverseGeocodeAsync(
      { latitude, longitude },
      { useGoogleMaps: true }
    );

    const specificLoc = location[0].district || location[0].street || location[0].subregion;
    setCity(location[0].city || location[0].region);
    setDistrict(specificLoc);

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    const json = await response.json();

    const date = new Date();
    const currentTimestamp = Math.floor(date.getTime() / 1000); // 현재 시간을 Unix timestamp로 변환

    const getLocalYMD = (d) => {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
    };
    const today = getLocalYMD(date);

    // 현재 시점 이후의 데이터만 필터링하여 48시간 (3시간 간격 * 16개) 데이터 가져오기
    const futureData = json.list.filter(item => item.dt >= currentTimestamp);
    setTodayWeather(futureData.slice(0, 16));

    // 주간 날씨: 날짜별 최저/최고 기온 계산
    const dailyForecasts = {};

    json.list.forEach((item) => {
      const itemDate = new Date(item.dt * 1000);
      const dateKey = getLocalYMD(itemDate);

      if (dateKey === today) return; // 오늘 날짜 제외

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          dt: item.dt,
          min: item.main.temp_min,
          max: item.main.temp_max,
          weather: item.weather[0],
        };
      } else {
        dailyForecasts[dateKey].min = Math.min(dailyForecasts[dateKey].min, item.main.temp_min);
        dailyForecasts[dateKey].max = Math.max(dailyForecasts[dateKey].max, item.main.temp_max);

        // 12시 데이터가 있으면 그 시간의 날씨 아이콘 사용 (선호) - 로컬 시간 기준 11시~13시 사이
        const hour = itemDate.getHours();
        if (hour >= 11 && hour <= 13) {
          dailyForecasts[dateKey].weather = item.weather[0];
        }
      }
    });

    setFutureWeather(Object.values(dailyForecasts));
  };

  useEffect(() => {
    getWeather();
  }, []);

  const today = new Date();
  const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <LinearGradient
      colors={theme}
      style={styles.container}
    >
      <StatusBar style="auto" />

      {/* 상단: 날짜 및 위치 */}
      <View style={styles.top}>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{dateString}</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={darkMode ? "sunny" : "moon"} size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text
          style={styles.locationName}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.5}
        >
          {city} {district}
        </Text>
      </View>

      {/* 중단: 오늘 날씨 (가로 스크롤) */}
      <View style={styles.middle}>
        <Text style={styles.sectionTitle}>Today</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {todayWeather.length === 0 ? (
            <ActivityIndicator color="black" size="large" />
          ) : (
            todayWeather.map((item, index) => (
              <View key={index} style={styles.todayItem}>
                <Text style={styles.todayTime}>
                  {new Date(item.dt * 1000).getHours().toString().padStart(2, '0')}:00
                </Text>
                <Text style={styles.todayTemp}>
                  {parseFloat(item.main.temp).toFixed(1)}°
                </Text>
                <Ionicons name={getWeatherIcon(item.weather[0].main)} size={24} color="white" style={{ marginTop: 10 }} />
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* 하단: 주간 예보 (세로 스크롤) */}
      <View style={styles.bottom}>
        <Text style={styles.sectionTitle}>Weekly Forecast</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.weatherList}
        >
          {futureWeather.length === 0 ? (
            <ActivityIndicator color="black" size="large" />
          ) : (
            futureWeather.map((day, index) => (
              <View key={index} style={styles.day}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dateTextSmall}>
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.temp}>
                    {parseFloat(day.min).toFixed(0)}° / {parseFloat(day.max).toFixed(0)}°
                  </Text>
                  <Ionicons name={getWeatherIcon(day.weather.main)} size={24} color="white" />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 20,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  middle: {
    flex: 1.2,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bottom: {
    flex: 3,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    marginBottom: 10,
  },
  horizontalScroll: {
    alignItems: "center",
  },
  todayItem: {
    alignItems: "center",
    marginRight: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 20,
    justifyContent: "center",
    width: 100,
  },
  todayTime: {
    fontSize: 14,
    color: "white",
    marginBottom: 5,
    fontWeight: "500",
  },
  todayTemp: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  todayTemp: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  weatherList: {
    paddingVertical: 10,
  },
  day: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    paddingVertical: 15,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  temp: {
    fontWeight: "600",
    fontSize: 32,
    color: "white",
  },
  dateText: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
  },
  dateTextSmall: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    width: 50,
  },
  locationName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
  },
});
