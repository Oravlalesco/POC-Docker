# Imagen base oficial y ligera de Nginx sobre Alpine Linux
FROM nginx:alpine

# Copiar la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los recursos del frontend al directorio raíz de Nginx
COPY . /usr/share/nginx/html

# Exponer el puerto estándar HTTP
EXPOSE 80

# Iniciar servidor Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]