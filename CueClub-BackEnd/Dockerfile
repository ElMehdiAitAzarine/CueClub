FROM python:3.12-slim

# Install system dependencies for MySQL/MariaDB
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.docker.txt .
RUN pip install --no-cache-dir -r requirements.docker.txt

COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads/user_photos uploads/qrcodes

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core_project.wsgi:application"]
