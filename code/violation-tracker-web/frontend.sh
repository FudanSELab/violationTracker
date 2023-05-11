#!/bin/bash

usage="\nUsage: startup.sh \n"

serviceName=frontend
basePath=.

# if no args specified, show usage
if [ $# -le 0 ]; then
  echo -e ${usage}
  exit 1
fi

option=${1}

start() {
  mv ${basePath}/${serviceName}.log ${basePath}/logs/${serviceName}_$(date +%Y-%m-%d-%H).log

  cd ${basePath}
  npm install
  npm run build
  nohup node ${basePath}/app.js >${basePath}/${serviceName}.log 2>&1
  echo "start"
}

stop() {
  echo "stop"
  ps -ef | grep app.js | head -n 1 | awk '{print $2}' | xargs sudo kill -9
}

case ${option} in
stop)
  stop
  ;;
start)
  start
  ;;
restart)
  stop
  start
  ;;
*)
  echo -e "No option $1"
  echo -e ${usage}
  exit 1
  ;;
esac
