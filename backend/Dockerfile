# Imagen base oficial y liviana de Python
FROM python:3.11-slim

# Evitar la creación de archivos .pyc y permitir logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del backend y la base de datos
COPY . .

#Crear el usuario del sistema 'appuser' y asignarle la propiedad de /app
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# Exponer el puerto de Flask
EXPOSE 5000

# Variables de entorno por defecto
ENV PORT=5000
ENV HOST=0.0.0.0
ENV FLASK_DEBUG=True

USER appuser

# Comando para iniciar la aplicación
CMD ["python", "app.py"]
