pkill "node"
pkill "redis-server"

# redis-server redis.conf &
node ./serve.js &
