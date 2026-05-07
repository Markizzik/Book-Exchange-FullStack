import boto3
from botocore.exceptions import BotoCoreError, ClientError, EndpointConnectionError

from .settings import get_settings


class MinIOClient:
    def __init__(self):
        settings = get_settings()
        self.endpoint_url = settings.minio_endpoint
        self.public_base_url = settings.minio_public_base_url
        self.access_key = settings.minio_access_key
        self.secret_key = settings.minio_secret_key
        self.bucket_name = settings.minio_bucket_name
        self.secure = settings.minio_secure
        self.ready = False

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            use_ssl=self.secure,
        )

        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Создание бакета, если он отсутствует, без падения приложения."""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ Бакет {self.bucket_name} уже существует в MinIO")
            self.ready = True
        except ClientError as error:
            error_code = str(error.response.get("Error", {}).get("Code", ""))
            if error_code in {"404", "NoSuchBucket", "NotFound"}:
                print(f"🔧 Создание бакета {self.bucket_name} в MinIO...")
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    print(f"✅ Бакет {self.bucket_name} успешно создан в MinIO")
                    self.ready = True
                except ClientError as create_error:
                    print(f"❌ Ошибка создания бакета в MinIO: {create_error}")
            else:
                print(f"❌ Ошибка проверки бакета в MinIO: {error}")
        except (EndpointConnectionError, BotoCoreError, OSError) as error:
            print(f"⚠️ MinIO недоступен при старте приложения: {error}")
            self.ready = False

    def healthcheck(self) -> bool:
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            self.ready = True
        except (ClientError, EndpointConnectionError, BotoCoreError, OSError):
            self.ready = False
        return self.ready

    def upload_cover(self, file, filename: str) -> str:
        """Загрузка обложки книги в MinIO"""
        try:
            self.client.upload_fileobj(
                file,
                self.bucket_name,
                filename,
                ExtraArgs={"ContentType": "image/jpeg"},
            )
            self.ready = True
            return f"{self.public_base_url.rstrip('/')}/{filename}"
        except (ClientError, EndpointConnectionError, BotoCoreError, OSError) as error:
            print(f"❌ Ошибка загрузки файла в MinIO: {error}")
            raise Exception(f"Ошибка загрузки обложки: {str(error)}")

    def delete_cover(self, filename: str) -> bool:
        """Удаление обложки книги из MinIO"""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=filename)
            self.ready = True
            return True
        except (ClientError, EndpointConnectionError, BotoCoreError, OSError) as error:
            print(f"❌ Ошибка удаления файла из MinIO: {error}")
            self.ready = False
            return False


minio_client = MinIOClient()
