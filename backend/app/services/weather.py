# backend/app/services/weather.py
import os
import urllib.request
import urllib.error
import json
from typing import Optional, Dict, Any

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_city_weather(city: str) -> Optional[Dict[str, Any]]:
    """
    Получить погоду для города через urllib (встроенная библиотека).
    Возвращает нормализованные данные или None при ошибке.
    """
    if not OPENWEATHER_API_KEY:
        return None  # Если ключа нет — ничего не возвращаем
        
    # Формируем URL с параметрами
    params = urllib.parse.urlencode({
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",  # Цельсий
        "lang": "ru"
    })
    url = f"{BASE_URL}?{params}"
    
    try:
        # Создаём запрос с таймаутом
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            
            # Нормализация данных
            return {
                "temp": round(data["main"]["temp"]),
                "feels_like": round(data["main"]["feels_like"]),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "city": data["name"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"]["speed"]
            }
    except (urllib.error.HTTPError, urllib.error.URLError):
        return None  # Город не найден или ошибка сети
    except Exception:
        return None  # Любая другая ошибка