from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
from app.core.config import settings
import uuid
from datetime import datetime
from typing import Tuple, Optional

# Inicializar cliente MinIO
minio_client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
    region=settings.MINIO_REGION
)

# Tamaño máximo de archivo: 2MB
MAX_FILE_SIZE = 2 * 1024 * 1024

# Tipos de archivo permitidos
ALLOWED_CONTENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
]


async def upload_file_to_minio(
    file: UploadFile,
    folder: str,
    organization_id: str
) -> Tuple[Optional[str], Optional[str]]:
    """
    Sube un archivo a MinIO y retorna la URL y el nombre del archivo.

    Args:
        file: Archivo a subir
        folder: Carpeta dentro del bucket (ej: "expenses", "receipts")
        organization_id: ID de la organización para separar archivos

    Returns:
        Tuple[url, filename] o Tuple[None, None] si falla
    """
    try:
        # Verificar que el bucket existe
        bucket_name = settings.MINIO_BUCKET_NAME
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)

        # Leer contenido del archivo
        contents = await file.read()
        file_size = len(contents)

        # Validar tamaño
        if file_size > MAX_FILE_SIZE:
            raise ValueError(f"El archivo excede el límite de 2MB ({file_size / 1024 / 1024:.2f}MB)")

        # Validar tipo de contenido
        content_type = file.content_type or 'application/octet-stream'
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError(f"Tipo de archivo no permitido: {content_type}")

        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        # Ruta completa en el bucket
        object_name = f"{organization_id}/{folder}/{datetime.now().strftime('%Y/%m')}/{unique_filename}"

        # Subir archivo
        from io import BytesIO
        minio_client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=BytesIO(contents),
            length=file_size,
            content_type=content_type
        )

        # Construir URL
        protocol = "https" if settings.MINIO_SECURE else "http"
        file_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{object_name}"

        return file_url, file.filename

    except S3Error as e:
        print(f"Error de MinIO: {e}")
        return None, None
    except ValueError as e:
        print(f"Error de validación: {e}")
        raise
    except Exception as e:
        print(f"Error inesperado subiendo archivo: {e}")
        return None, None


async def delete_file_from_minio(file_url: str) -> bool:
    """
    Elimina un archivo de MinIO dado su URL.
    
    Args:
        file_url: URL completa del archivo
        
    Returns:
        True si se eliminó correctamente, False si falló
    """
    try:
        bucket_name = settings.MINIO_BUCKET_NAME
        
        # Extraer object_name de la URL
        # URL format: https://endpoint/bucket/object_name
        parts = file_url.split(f"/{bucket_name}/")
        if len(parts) != 2:
            return False
            
        object_name = parts[1]
        
        minio_client.remove_object(bucket_name, object_name)
        return True

    except S3Error as e:
        print(f"Error eliminando archivo de MinIO: {e}")
        return False
    except Exception as e:
        print(f"Error inesperado: {e}")
        return False


def get_presigned_url(file_url: str, expiry_hours: int = 1) -> str:
    """
    Genera una URL firmada temporal para ver un archivo privado.
    
    Args:
        file_url: URL original del archivo (almacenada en BD)
        expiry_hours: Tiempo de validez en horas (default 1)
        
    Returns:
        URL firmada o la URL original si falla
    """
    try:
        if not file_url:
            return file_url
            
        bucket_name = settings.MINIO_BUCKET_NAME
        
        # Extraer object_name de la URL
        parts = file_url.split(f"/{bucket_name}/")
        if len(parts) != 2:
            return file_url
            
        object_name = parts[1]
        
        from datetime import timedelta
        
        # Generar URL firmada
        presigned_url = minio_client.get_presigned_url(
            "GET",
            bucket_name,
            object_name,
            expires=timedelta(hours=expiry_hours),
        )
        return presigned_url

    except Exception as e:
        print(f"Error generando URL firmada: {e}")
        return file_url
