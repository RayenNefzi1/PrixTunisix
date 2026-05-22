FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV BACKEND_API_URL=https://prixtunisix-api.onrender.com/api
ENV DB_HOST=dpg-d87hfguq1p3s73b6qk8g-a
ENV DB_PORT=5432
ENV DB_NAME=prixtunisix
ENV DB_USER=prixtunisix_user
ENV DB_PASS=9bi6U87HM95auvf7HHiKruRkA3JWfNh8

# Test connection and run spider
CMD bash -c "cd prixtunisix && scrapy crawl tunisianet --loglevel=INFO"