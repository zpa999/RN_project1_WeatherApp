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
} from "react-native";

// Dimensions API를 사용하여 현재 디바이스의 화면 크기를 가져옵니다.
// "window"는 현재 앱이 사용할 수 있는 화면 영역을 의미합니다.
// width를 가져와서 SCREEN_WIDTH라는 변수에 할당합니다.
const { width: SCREEN_WIDTH } = Dimensions.get("window");
console.log(SCREEN_WIDTH); // 콘솔에 화면 너비를 출력하여 확인합니다.

const API_KEY = "1490b2d633b088678c93f6148cf42918";

export default function App() {
  const [city, setCity] = useState("Loading...");
  const [days, setDays] = useState([]);
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
      { useGoogleMaps: false }
    );

    setCity(location[0].city);

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    const json = await response.json();
    setDays(
      json.list.filter((weather) => {
        if (weather.dt_txt.includes("12:00:00")) {
          return true;
        }
        return false;
      })
    );
  };
  useEffect(() => {
    getWeather();
  }, []);

  return (
    // View는 UI를 구성하는 가장 기본적인 컨테이너 컴포넌트입니다. (HTML의 div와 유사)
    // style props를 통해 스타일을 적용합니다.
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* 도시 이름을 보여주는 영역 */}
      <View style={styles.city}>
        <Text style={styles.cityName}>{city}</Text>
      </View>

      {/* 
        ScrollView는 스크롤 가능한 컨테이너입니다.
        - pagingEnabled: 스크롤 시 페이지 단위로 딱딱 끊어지게 만듭니다.
        - horizontal: 가로 스크롤을 활성화합니다.
        - showsHorizontalScrollIndicator: 가로 스크롤 바를 숨깁니다.
        - contentContainerStyle: ScrollView 내부 콘텐츠의 스타일을 지정할 때 사용합니다. (style prop과는 다릅니다!)
      */}
      <ScrollView
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        contentContainerStyle={styles.weather}
      >
        {days.length === 0 ? (
          <View style={styles.day}>
            <ActivityIndicator
              color="white"
              style={{ marginTop: 10 }}
              size="large"
            />
          </View>
        ) : (
          days.map((day, index) => (
            <View key={index} style={styles.day}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {new Date(day.dt * 1000).toString().substring(0, 10)}
                </Text>
              </View>
              <Text style={styles.temp}>
                {parseFloat(day.main.temp).toFixed(1)}
              </Text>
              <Text style={styles.description}>{day.weather[0].main}</Text>
              <Text style={styles.tinyText}>{day.weather[0].description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "tomato",
  },
  city: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  cityName: {
    fontSize: 58,
    fontWeight: "500",
  },
  weather: {},
  day: {
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
  temp: {
    marginTop: 50,
    fontWeight: "600",
    fontSize: 178,
  },
  description: {
    marginTop: -30,
    fontSize: 60,
  },
  tinyText: {
    fontSize: 20,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 30,
    fontWeight: "500",
    color: "black",
  },
});
