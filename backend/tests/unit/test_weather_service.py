import json
import urllib.error

import pytest

from app.services import weather


class FakeWeatherResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


@pytest.mark.unit
def test_get_city_weather_normalizes_response(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(weather, "OPENWEATHER_API_KEY", "test-key")
    monkeypatch.setattr(
        weather.urllib.request,
        "urlopen",
        lambda request, timeout=5: FakeWeatherResponse(
            {
                "name": "Moscow",
                "main": {"temp": 18.4, "feels_like": 16.6, "humidity": 70},
                "weather": [{"description": "ясно", "icon": "01d"}],
                "wind": {"speed": 4.5},
            }
        ),
    )

    result = weather.get_city_weather("Moscow")

    assert result == {
        "temp": 18,
        "feels_like": 17,
        "description": "ясно",
        "icon": "01d",
        "city": "Moscow",
        "humidity": 70,
        "wind_speed": 4.5,
    }


@pytest.mark.unit
def test_get_city_weather_returns_none_when_api_key_missing(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(weather, "OPENWEATHER_API_KEY", None)

    assert weather.get_city_weather("Moscow") is None


@pytest.mark.unit
def test_get_city_weather_returns_none_on_http_error(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(weather, "OPENWEATHER_API_KEY", "test-key")

    def raise_error(request, timeout=5):
        raise urllib.error.HTTPError(
            url="http://example.com",
            code=404,
            msg="Not Found",
            hdrs=None,
            fp=None,
        )

    monkeypatch.setattr(weather.urllib.request, "urlopen", raise_error)

    assert weather.get_city_weather("Unknown") is None
