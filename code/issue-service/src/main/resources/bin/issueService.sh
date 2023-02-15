#!/bin/bash

usage="\nUsage: startup.sh \n"

serviceName=issue
basePath=/home/fdse/codeWisdom/service/${serviceName}/debug
logPath=${basePath}/log
pidFile=${basePath}/toolPid.log
monitorFile=${basePath}/portMonitor.sh

# if no args specified, show usage
if [ $# -le 0 ]; then
  echo -e ${usage}
  exit 1
fi

if [ ! -d "$logPath/monitor" ]; then
  mkdir -p $logPath/monitor
fi

option=${1}

start() {
  # 可能存在多个检测脚本
  monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  while [ "$monitorPid" != "" ]; do
    kill -9 $monitorPid
    monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  done
  config="-Dspring.config.location=${basePath}/application-${serviceName}.properties"
  mv ${basePath}/${serviceName}.log ${logPath}/${serviceName}_$(date +%Y%m%d%H%M).log
  nohup /home/fdse/user/Component/sonar/sonarJava/jdk-11.0.4/bin/java -jar -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=10.176.34.85:5011 ${config} -Xdebug ${basePath}/debug-${serviceName}-1.0.3.jar >${basePath}/${serviceName}.log 2>&1 &
  pid=$!
  echo $(date +%Y%m%d%H%M) ${pid} >>./pid.log
  echo $(date +%Y%m%d%H%M) ${pid} >${pidFile}
  echo "start"
  if [ -f "$monitorFile" ]; then
    nohup $monitorFile 8865 >${logPath}/monitor/live-monitor-${pid}.log 2>&1 &
    echo "start monitor " ${logPath}/monitor/live-monitor-${pid}.log
  fi
}

stop() {
  pid=$(jps | grep debug-${serviceName}-1.0.3.jar | awk '{print $1}')
  kill -9 $pid
  echo "stop"
#  mPid1=$(fuser -uv ${logPath}/monitor/live-monitor-${pid}.log | grep -v "进程号" | awk '{print $1}')
#  mPid2=$(fuser -uv ${logPath}/monitor/live-monitor-${pid}.log | grep -v "进程号" | awk '{print $2}')
#  kill -9 $mPid1
#  kill -9 $mPid2
  monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  while [ "$monitorPid" != "" ]; do
    kill -9 $monitorPid
    monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  done
  echo "stop monitor"
}

IFS=' '
killTools() {
  # 读取 tool pid 列表
  # 202212151011 52254 sonarqube
  i=1
  while read -r line; do
    # echo "PID No. $i : $line"
    read -ra pidArr <<<"$line"
    if [ ${#pidArr[@]} -gt 2 ] && [ "${pidArr[2]}" == "sonarqube" -o "${pidArr[2]}" == "tscancode" -o "${pidArr[2]}" == "eslint" ]; then
      PID_EXIST=$(ps aux | awk '{print $2}' | grep -w "${pidArr[1]}")
      if [ !$PID_EXIST ]; then
        # echo "the process ${pidArr[1]} is not exist"
        continue
      else
        echo "kill tool pid: ${pidArr[1]}"
        kill -9 "${pidArr[1]}"
      fi
    fi
    i=$((i + 1))
  done <$pidFile
}

case ${option} in

stop)
  stop
  killTools
  ;;
start)
  start
  ;;
restart)
  stop
  sleep 1
  start
  ;;
*)
  echo -e "No option $1"
  echo -e ${usage}
  exit 1
  ;;

esac
