docker run --name nqwest-db \
  -e POSTGRES_USER=sparsoft \
  -e POSTGRES_PASSWORD=nqwest \
  -e POSTGRES_DB=nqwest \
  -p 5432:5432 \
  -d postgres:16
