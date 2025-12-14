import os
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError
from typing import Optional

load_dotenv()

class MinIOClient:
    def __init__(self):
        self.endpoint_url = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "book-covers")
        self.secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
        
        # Инициализация клиента MinIO
        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            use_ssl=self.secure
        )
        
        # Создание бакета, если он отсутствует
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Создание бакета, если он отсутствует"""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ Бакет {self.bucket_name} уже существует в MinIO")
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                print(f"🔧 Создание бакета {self.bucket_name} в MinIO...")
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    print(f"✅ Бакет {self.bucket_name} успешно создан в MinIO")
                except ClientError as create_error:
                    print(f"❌ Ошибка создания бакета в MinIO: {create_error}")
            else:
                print(f"❌ Ошибка проверки бакета в MinIO: {e}")
    
    def upload_cover(self, file, filename: str) -> str:
        """Загрузка обложки книги в MinIO"""
        try:
            self.client.upload_fileobj(
                file,
                self.bucket_name,
                filename,
                ExtraArgs={'ContentType': 'image/jpeg'}
            )
            # Формирование публичного URL
            protocol = "https" if self.secure else "http"
            host = self.endpoint_url.split("://")[1]
            return f"{protocol}://{host}/{self.bucket_name}/{filename}"
        except ClientError as e:
            print(f"❌ Ошибка загрузки файла в MinIO: {e}")
            raise Exception(f"Ошибка загрузки обложки: {str(e)}")
    
    def delete_cover(self, filename: str) -> bool:
        """Удаление обложки книги из MinIO"""
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=filename
            )
            return True
        except ClientError as e:
            print(f"❌ Ошибка удаления файла из MinIO: {e}")
            return False

# Создание экземпляра клиента
minio_client = MinIOClient()