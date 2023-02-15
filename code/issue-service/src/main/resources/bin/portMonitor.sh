#!/bin/bash
serviceName=issue
basePath=/home/fdse/codeWisdom/service/${serviceName}/debug
monitorFile=${basePath}/portMonitor.sh
logPath=${basePath}/log
pidFile=${basePath}/toolPid.log
maxMem=25         #设置最大内存占用比例
maxRunningDays=14 #设置最大运行天数，2 周
interval=1800     #设置采集间隔，0.5 小时

port=$1

if [ ! -d "$logPath/monitor" ]; then
  mkdir -p $logPath/monitor
fi

restart() {
  oPid=$1
  kill -9 $oPid
  #  mPid1=$(fuser -uv ${logPath}/monitor/live-monitor-${oPid}.log | grep -v "进程号" | awk '{print $1}')
  #  mPid2=$(fuser -uv ${logPath}/monitor/live-monitor-${oPid}.log | grep -v "进程号" | awk '{print $2}')
  #  kill -9 $mPid1
  #  kill -9 $mPid2
  #  echo "stop monitor"
  sleep 5
  config="-Dspring.config.location=${basePath}/application-${serviceName}.properties"
  mv ${basePath}/${serviceName}.log ${logPath}/${serviceName}_$(date +%Y%m%d%H%M).log
  nohup /home/fdse/user/Component/sonar/sonarJava/jdk-11.0.4/bin/java -jar -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=10.176.34.85:5011 ${config} -Xdebug ${basePath}/debug-${serviceName}-1.0.3.jar >${basePath}/${serviceName}.log 2>&1 &
  pid=$!
  echo $(date +%Y%m%d%H%M) ${pid} "auto restart" >>./pid.log
  echo $(date +%Y%m%d%H%M) ${pid} >${pidFile}
  echo "start"
  # 重新监控
  sleep 30
  nohup $monitorFile $poZZrt >${logPath}/monitor/live-monitor-${pid}.log 2>&1 &
  mPid=$!
  echo "start monitor " ${logPath}/monitor/live-monitor-${pid}.log
  # 可能存在多个检测脚本
  monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  while [ "$monitorPid" != "" ]; do
    if [ "$monitorPid" != "$mPid" ]; then
      kill -9 $monitorPid
    fi
    monitorPid=$(fuser -uv ${monitorFile} | grep -v "进程号" | awk '{print $1}')
  done
}

for ((i = 0; i < 3; i++)); do
  pid=$(lsof -i:$port | grep "LISTEN" | grep -v "PID" | awk '{print $2}') #获取进程pid
  liveLog=${logPath}/monitor/live-monitor-${pid}.log
  echo "port: " $port " pid: " $pid
  # 检测端口是否被占用
  if [ "$pid" == "" ]; then
    sleep 60
    continue
  else
    echo "服务进程号：$pid"
    echo $liveLog
    echo "listen on $pid ..."
    while true; do
      datetime=$(date +"%Y-%m-%d %H:%M:%S") #>>$liveLog
      if [ ! -f "/proc/$pid/status" ]; then
        echo "$pid 服务已停止"
        restart $pid
        exit
      fi
      memKB=$(cat /proc/$pid/status | grep -e VmRSS) #>>$liveLog                    #获取内存占用kB
      memKB=${memKB#*VmRSS:}
      memKB=${memKB%kB*}
      mem=$(top -b -n 1 -p $pid | grep $pid | awk '{ssd=NF-2} {print $ssd}') #获取cpu占用%
      cpu=$(top -b -n 1 -p $pid | grep $pid | awk '{ssd=NF-3} {print $ssd}') #获取cpu占用%
      #echo "Mem: " $mem " %" #>>$liveLog
      #echo "Cpu: " $cpu " %" #>>$liveLog
      # 计算当天 - 指定日期相隔天数
      lastLine=$(tail -n 1 ./pid.log)
      lastTime=$(expr substr "${lastLine}" 1 8)
      days=$((($(date +%s) - $(date +%s -d $lastTime)) / 86400))
      #echo "Days: " $days #>>$liveLog
      echo -e "time\tmemKB\tmem(%)\tcpu(%)\tdays"
      echo -e "$datetime\t$memKB\t$mem\t$cpu\t$days"
      echo $blank #>>$liveLog
      if [ $(echo "$mem>$maxMem" | bc) -eq 1 ] || [ $days -ge $maxRunningDays ]; then
        echo "内存占用过高或运行时间过长，自动重启服务"
        restart $pid
        exit
      fi
      sleep $interval
    done
  fi
done

echo "服务已停止"
restart
exit
