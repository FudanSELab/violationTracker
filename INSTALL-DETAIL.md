
# Technology Skills Required

Users are supposed to have basic skills to work with Docker and MySql as well as Linux terminals.

# Environment Required for Running the Artifact

**Hardware requirement**.

*Memory*. 16GB RAM is suggested for running the artifact. However, ViolationTracker also passed the tests with only 4GB RAM when running with the accompanied example project. Typically, larger RAM supports larger software projects and longer evolution histories to be analyzed. 

*CPU*. Servers or workstations with mainstream CPUs should suffice.

*Storage*. Please prepare minimal 14GB free disk space (8GB for Docker and 6GB for the artifact working directory). If you are planning to try ViolationTracker on more projects, please prepare more disk space. 

The reason of the disk space requirement is mainly for the sake of ease of use. The size of the core modules of ViolationTracker is about 90MB. It depends on SonarQube, MySql and MongoDB and requires certain configurations. To make the configurations easier, we decide to pack all dependencies, including SonarQube, MySql, and MongoDB, into Docker images so that the configurations can be almost automatic.

**Software requirement**.
*Operating System (OS)*. The artifact requires Linux-based OS with Docker support. We have tested the artifact under CentOS 7, Ubuntu Server 18.04.2, and Ubuntu Server 22.04.1. CentOS 7+ or Ubuntu Server 18+ should suffice.

Windows OS is *not* tested and may cause error due to different path separators used.

*Docker*. To make the artifact work, Docker Engine and related components should be properly installed. Make sure you have successfully installed Docker for CentOS according to the official docker [documentation](https://docs.docker.com/engine/install/centos/). If you are using Ubuntu, you can also find [documentation](https://docs.docker.com/engine/install/ubuntu/#installation-methods) to install Docker.

**Note**: Docker's default image storage path is /var/lib/docker/. All images of this artifact takes no more than 5GB storage. However, working data may use additional space. Therefore, please allow approximately 8GB disk space in this directory. If you are planning to try ViolationTracker on more projects, please prepare more disk space.

# Getting Started

## Setting up the Environment

When you setup the server environment, please **ensure you have `sudo` priviledge or logged in as root**.

<!-- 1.Here are the setup insturctions to run docker, please run with sudo privileges or use root account: -->

1. Install and run Docker. Docker version should be no lower than v20.10 (updated on December 4, 2020). If you have already had Docker Engine and related components installed and started, you may skip this step. If you are using Ubuntu, the setup is different. Please refer to Docker official [documentation](https://docs.docker.com/engine/install/ubuntu/#installation-methods) for Ubuntu to install.

```shell
    yum -y install docker-ce
    systemctl start docker
```

<!--
- When using docker for the first time it is need to login first.
```shell
    docker login
```
-->

2. [Optional] In order to run ViolationTracker with larger projects, it is suggested to run the following commands on CentOS systems to optimize SonarQube and MySql performance. These commands may be slightly different on Ubuntu systems.

```shell
    sysctl -w vm.max_map_count=655360
    sysctl -w net.ipv4.tcp_fin_timeout=30 net.ipv4.tcp_tw_recycle=1 net.ipv4.tcp_syncookies=1 net.ipv4.tcp_tw_reuse=1
```

3. The services of ViolationTracker will use the following ports. Please ensure that these ports are not occupied.

```
    3306 -mysql
    9000 -sonarqube
    27017 -mongodb
    8005 -ViolationTracker
```

<!--  build  docker file and  run docker compose -->

## Setup

Download the ViolationTracker artifact package file `icse-artifact.tar.gz`.

After downloading the file `icse-artifact.tar.gz`, please use the following command to unzip the file:

```shell
tar -zxvf icse-artifact.tar.gz
```

Then, configure environment by:

```shell
cd icse-artifact/
/bin/bash configureEnvironment.sh
```

**Note**: The working directory is **icse-artifact/**. After unpacking all components, it will take about 3GB disk space. Please allow approximately 5GB of disk space in the directory for data storage. If you are planning to try ViolationTracker on more projects, please prepare more disk space.

## Make Your Hands Dirty (less than 30min)

We prepared the **cim** repository in the **icse-artifact/repo/** directory for the demonstrating the functionalties of ViolationTracker. The following instructions will guide you to run the tool and start analyzing 10 commits of the repository **cim** to experience the functionalities of ViolationTracker. 

**Step1**: Enter the woking directory.

```shell
cd icse-artifact/violation/
```

**Step2**: Run the script to start the services. 

```shell
 ./issue-service.sh start
```

Then, you will see the following success information. Now, ViolationTracker is ready to accept analysis requests.

```
INFO 253605 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8005 (http) with context path ''
INFO 253605 --- [           main] c.e.f.i.IssueServiceApplication          : Started IssueServiceApplication in 8.457 seconds (JVM running for 9.091)
```

**Step3**: Analyze the sample code repository.

The sample code repository is placed under the directory **icse-artifact/repo/**. If you want to analyze a repository other than the accompanied one, please refer to [Analyze another repository](#Analyze another repository).
Now run the script `startScan.sh` to analyze the code repository.
The usage of the command is as follows:

```shell
 ./startScan.sh <repoPath> <beginCommit> <endCommit> <branch> <repoId>
```

where <repoPath> is the directory in which the code repository is located, <beginCommit> and <endCommit> are the commit ids that specify the time period to be analyzed, <branch> is the branch name to be anlyzed in the repository, and <repoId> is the name for further reference in the database. Please note that <repoPath> should be a relative path starting from the directory where the `icse-artifact.tar.gz` file is located and it should *not* end with a directory separator (/). 

A quick demo command is shown below. You may copy and paste the command in your linux terminal. 

```shell
./startScan.sh icse-artifact/repo/cim c7aa5de5412c0bedf52e2ead15b23603ae6038fa  bb53a1065ec26be2008a5553080ea72eeba8b5ae master cim
```

Then, you will see information scrolling when ViolationTracker is running.

```
INFO 142971 --- [nio-8005-exec-2] c.e.f.i.controller.IssueScanController   : process scan request, repo cim, branch master, begin commit c7aa5de5412c0bedf52e2ead15b23603ae6038fa
INFO 142971 --- [k-thread-pool-1] c.edu.fudan.common.scan.BaseScanProcess  : tools: [sonarqube]
INFO 142971 --- [k-thread-pool-1] c.e.f.i.core.IssueScanProcess            : get begin commit:c7aa5de5412c0bedf52e2ead15b23603ae6038fa from request
INFO 142971 --- [  cim-sonarqube] c.edu.fudan.common.scan.BaseScanProcess  : repoPath is /root/icse-artifact/repo/cim
```

When the analysis is done, you will see the following information. The script will not automatically terminate. You can return to the command line interface by pressing **Ctrl + C**.

```
INFO 253605 --- [           main] c.e.f.i.c.IssueToolScanImpl          : judgeSolvedType repo cim done
```

Now all violations in the specified repository and within the specified time period are detected, matched, and tracked. All data are stored in the imbedded MySql database which is running in a docker container. 

**Step4**: Check results

You may use the following command to access MySql in the docker container。

```
docker exec -it mysql-violation /bin/bash
```

Then execute the following commands to access the database.

```
mysql -uroot -proot
use issueTrackerTest
```

Now we provide with some query examples to show the analysis results.

**Example 1**：Find the number of new, changed, resolved violations in a specific commit.

```
SELECT cur_commit_id,pre_commit_id,status,solve_way,count(*) as num \
FROM raw_issue_match_info \
WHERE cur_commit_id = 'ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e' and status <> 'default' \
GROUP BY cur_commit_id,pre_commit_id, status,solve_way \
ORDER BY num ;
```

You will get:

```
+------------------------------------------+------------------------------------------+---------+-----------------------+-----+
| cur_commit_id                            | pre_commit_id                            | status  | solve_way             | num |
+------------------------------------------+------------------------------------------+---------+-----------------------+-----+
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | solved  | anchor_delete         |   1 |
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | solved  | code_unrelated_change |   1 |
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | changed | NULL                  |   2 |
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | solved  | file_delete           |   3 |
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | solved  | code_change           |   4 |
| ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | empty                                    | add     | NULL                  |  20 |
+------------------------------------------+------------------------------------------+---------+-----------------------+-----+
```

In the output, **cur_commit_id** indicates the specified revision (commit), **pre_commit_id** indicates the previous revision (parent commit), and **status** indicates the violation **matching status**. When the match result is **add** (**NEW** in the paper), **pre_commit_id** is **empty**; when the matching status is not **solved**, the **solve_way** is **NULL**.
It should be noted that the closing methods of violation cases in this paper are divided into FIXED and DELETED, which can be inferred by the values of **status** and **solve_way**. Please refer to the ICSE 2023 ViolationTracker paper for the details of matching status.

We further query what violation cases are solved by 'code_change'  in the commit 'ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e'.

```
SELECT issue_uuid,cur_rawIssue_uuid,pre_rawIssue_uuid \
FROM raw_issue_match_info \
WHERE cur_commit_id = 'ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e' AND status = 'solved' AND solve_way = 'code_change';
```

Then you will see:

```
+--------------------------------------+-------------------+--------------------------------------+
| issue_uuid                           | cur_rawIssue_uuid | pre_rawIssue_uuid                    |
+--------------------------------------+-------------------+--------------------------------------+
| f6a8caec-8655-3b77-ae86-4abe9853fe88 | empty             | b4573aa6-7c9b-3889-b9c4-90dcba9e5fa5 |
| 0e296dd8-b185-3809-aa89-85b4a0055c13 | empty             | 88a03572-8b99-321d-ac65-67929d1d809e |
| 7954959c-6a06-39e7-af85-2d9b118727ec | empty             | 146512cd-ffa4-3dd9-8ae2-eef1c7ce9705 |
| 00806726-a553-3598-823e-6c1fd8cf2cdb | empty             | 134cf6ad-7753-39a5-8b39-9d906c846dc6 |
+--------------------------------------+-------------------+--------------------------------------+
```

The **issue_uuid** is the unique identifier of a violation case. Here we represent a *violation case* as *issue* and a *violation instance* as *raw_issue*.  These are both resolved violation cases, the **cur_rawIssue_uuid** in this revision is empty, and **pre_rawIssue_uuid** is represented as the unique identifier of the matched violation instance in the previous revision.

**Example 2**：Find the basic information of a violation case (code repository, file relative path, violation type, starting commit, ending commit, the developer who introduced the violation, and the developer who solved the violation).

```
SELECT repo_uuid,file_name,type,start_commit,end_commit,producer,solver  \
FROM issue \
WHERE uuid = 'f6a8caec-8655-3b77-ae86-4abe9853fe88';
```

Then you will see:

```
+-----------+------------------------------------------------------------------------------------+----------------------------------------------------+------------------------------------------+------------------------------------------+--------------+--------------+
| repo_uuid | file_name                                                                          | type                                               | start_commit                             | end_commit                               | producer     | solver       |
+-----------+------------------------------------------------------------------------------------+----------------------------------------------------+------------------------------------------+------------------------------------------+--------------+--------------+
| cim       | cim-common/src/main/java/com/crossoverjie/cim/common/protocol/CIMRequestProto.java | Field names should comply with a naming convention | c7aa5de5412c0bedf52e2ead15b23603ae6038fa | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | crossoverJie | crossoverJie |
+-----------+------------------------------------------------------------------------------------+----------------------------------------------------+------------------------------------------+------------------------------------------+--------------+--------------+
```

**Example 3**：Find the evolution history of violations, including when they were introduced, when they were resolved, and what changes have taken place.

```
SELECT repo_uuid,cur_commit_id,pre_commit_id,cur_rawIssue_uuid,pre_rawIssue_uuid,status,solve_way \
FROM raw_issue_match_info \
WHERE issue_uuid = 'f6a8caec-8655-3b77-ae86-4abe9853fe88';
```

Then you will see:

```
+-----------+------------------------------------------+------------------------------------------+--------------------------------------+--------------------------------------+---------+-------------+
| repo_uuid | cur_commit_id                            | pre_commit_id                            | cur_rawIssue_uuid                    | pre_rawIssue_uuid                    | status  | solve_way   |
+-----------+------------------------------------------+------------------------------------------+--------------------------------------+--------------------------------------+---------+-------------+
| cim       | c7aa5de5412c0bedf52e2ead15b23603ae6038fa | empty                                    | f6a8caec-8655-3b77-ae86-4abe9853fe88 | empty                                | add     | NULL        |
| cim       | 528076a385ae15b6179885f324ff5e5f8a036040 | b9dbd076556b7e59d727fa0a6d985c4526875c46 | fa648b21-2a81-3aeb-ac78-16cd4f127300 | f6a8caec-8655-3b77-ae86-4abe9853fe88 | changed | NULL        |
| cim       | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | 25ee8964f81a96d88980aafb3141521710397759 | b4573aa6-7c9b-3889-b9c4-90dcba9e5fa5 | fa648b21-2a81-3aeb-ac78-16cd4f127300 | changed | NULL        |
| cim       | ca21b9b7da5d4e67ee2dcb86e0d6ac3327cbd61e | cd3b15679227e96d66d50d76ec9f9fadc79ecf51 | empty                                | b4573aa6-7c9b-3889-b9c4-90dcba9e5fa5 | solved  | code_change |
+-----------+------------------------------------------+------------------------------------------+--------------------------------------+--------------------------------------+---------+-------------+
```

**Example 4**：Find the information of a specific violation instance and its locations.

- Find the code repository, file, violation type, and explanation of the violation instance.
  
  ```
  SELECT repo_uuid,file_name,type,detail \
  FROM raw_issue \
  WHERE uuid = 'f6a8caec-8655-3b77-ae86-4abe9853fe88';
  ```
  
  Then you will see:
  
  ```
  +-----------+-------------------------------------------------------------------------------------------------------+----------------------------------------------------+-----------------------------------------------------------------------------------------------+
  | repo_uuid | file_name                                                                                             | type                                               | detail                                                                                        |
  +-----------+-------------------------------------------------------------------------------------------------------+----------------------------------------------------+-----------------------------------------------------------------------------------------------+
  | cim       | netty-action-common/src/main/java/com/crossoverjie/netty/action/common/protocol/BaseRequestProto.java | Field names should comply with a naming convention | Rename this field "requestId_" to match the regular expression '^[a-z][a-zA-Z0-9]*$'.---MINOR |
  +-----------+-------------------------------------------------------------------------------------------------------+----------------------------------------------------+-----------------------------------------------------------------------------------------------+
  ```

- Find the class, method, the start and end line numbers of the violation instance, and the corresponding source code of the violation.
  
  ```
  SELECT repo_uuid,file_name,start_line,end_line,class_name,method_name,code \
  FROM location \
  WHERE rawIssue_uuid = 'f6a8caec-8655-3b77-ae86-4abe9853fe88';
  ```
  
  Then you will see:
  
  ```
  +-----------+-------------------------------------------------------------------------------------------------------+------------+----------+-----------------+-------------+-------------------------+
  | repo_uuid | file_name                                                                                             | start_line | end_line | class_name      | method_name | code                    |
  +-----------+-------------------------------------------------------------------------------------------------------+------------+----------+-----------------+-------------+-------------------------+
  | cim       | netty-action-common/src/main/java/com/crossoverjie/netty/action/common/protocol/BaseRequestProto.java |        129 |      129 | RequestProtocol | requestId_  | private int requestId_; |
  +-----------+-------------------------------------------------------------------------------------------------------+------------+----------+-----------------+-------------+-------------------------+
  ```

You can return to the command line interface in docker container by using the command **exit**, and then use the command **exit** again to return to the command line interface of the server.

### Analyze another repository

The sample code repository is placed under the directory **icse-artifact/repo/**.
Copy the prepared code repository to directory **icse-artifact/repo/**, making sure to include the **.git** folder under the code repository. Then execute the script **startScan.sh** in directory **icse-artifact/violation/**

```
 ./startScan.sh  <repoPath>  <beginCommit>  <endCommit>  <branch>  <repoId>

 <repoPath> is the path of the code repository and needs to be placed into the icse-artifact/repo/ directory, ie
 <beginCommit> is the beginning commit hash to analyze
 <endCommit> is the last commit hash to analyze
Note that the commit date of <beginCommit> is earlier than the commit date of <endCommit>
 <branch> is the branch of the code repository that needs to be analyzed
<repoId> is a unique identifier for the code repository, ensuring that it is within 36 characters
```

### Restart services

If your server is rebooted, follow these steps to restart the services.

1. Start docker
   
   ```
   systemctl start docker
   ```

2. If docker container still exists, you can use the following command to restart it. 
   If the container does not exist, we suggest that you [reset the environment](#Reset the configuration environment) and re-analyze it.
- Check that the docker container still exists
  
  ```
  docker ps -a | grep violation | awk '{print $NF}'
  ```

- You should see the following output indicating that the container is still there 
  
  ```
  sonar-violation
  mysql-violation
  mongo-violation
  ```

- Using the following command to restart it 
  
  ```
  docker restart sonar-violation
  docker restart mysql-violation
  docker restart mongo-violation
  ```
3. Run the violation services
   
   ```
   cd icse-artifact/violation
   ./issue-service.sh start
   ```

### Reset the configuration environment

**Note**.  If something went wrong and you need to reset your environment, execute the following script.

```
cd  icse-artifact/
/bin/bash emptyEnvironment.sh
```
  
### Replace the default database embedded in SonarQube with PostgreSQL. 

1. First stop and delete the original SonarQube container.
```
docker stop sonar-violation && docker rm sonar-violation
```

2. Then execute the following command to start PostgreSQL and specify SonarQube's database.
```
docker pull postgres:10

docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=1 --name violation-postgres postgres:10

docker exec -it violation-postgres  /bin/bash -c 'psql -U postgres -w  -c "CREATE DATABASE sonar;"'

docker run -d -p 9000:9000 \
	-e "SONARQUBE_JDBC_URL=jdbc:postgresql://host.docker.internal:5432/sonar" \
	-e "SONARQUBE_JDBC_USERNAME=postgres" \
	-e "SONARQUBE_JDBC_PASSWORD=1" \
	--add-host=host.docker.internal:host-gateway \
	--name sonar-violation fancying/sonar:violation
```
  
### Supports

If you experience any other difficulties, please contact wuyijian@fudan.edu.cn for technical support.
Please also find updates from our [website](https://github.com/FudanSELab/violationTracker)
