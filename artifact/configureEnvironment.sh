echo "Start configuration"

basePath=$(cd `dirname $0`; pwd)

cd ${basePath}/dependence/

docker load -i mongo.tar ; docker load -i mysql.tar ; docker load -i sonar.tar 

    docker run -itd --name mongo-violation -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=root fancying/mongo:violation
    
    docker run -p 3306:3306 --name mysql-violation -e MYSQL_ROOT_PASSWORD=root -d fancying/mysql:violation
	
    docker run -d --name sonar-violation -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 --add-host=host.docker.internal:host-gateway fancying/sonar:violation


tar -zxvf sonar-scanner.tar.gz

tar -zxvf jdk-11.0.11.tar.gz

cd ${basePath}
chmod +x ./dependence/sonar-scanner-4.7.0.2747-linux/jre/bin/* && chmod +x ./dependence/sonar-scanner-4.7.0.2747-linux/bin/* && chmod +x ./dependence/jdk-11.0.11/bin/*

echo "Starting dockers, please wait ..."

    
        for i in $(seq 1 24)
        do
        sleep 10s

        result=$(docker exec -it mysql-violation /bin/bash -c 'mysql -uroot -proot -e "show databases;"' | grep "Database")
        if [[ "${result}" != "" ]]
        then
			break
        fi
        done


    docker exec -it mysql-violation /bin/bash -c 'mysql -uroot -proot < /issueTrackerTest.sql' 
	sleep 20s	
    docker exec -it mongo-violation /bin/bash -c 'mongo localhost:27017/admin createdb.js' 	

cd ${basePath}/violation/
chmod +x bin/* *.sh

./modifyProperties.sh

echo "End configuration"
