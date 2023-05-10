#!/bin/bash
source /etc/profile

repoPath=${1}
projectName=${2}
version=${3}
baseProjectPath=/home/fdse/user/codeWisdom/service

sonarScannerHome=/home/fdse/user/codeWisdom/dependency/sonar/sonar-scanner-4.0.0.1744-linux/bin/
sonarScannerLog=${baseProjectPath}/issue/log/sonar/sonar-running-${projectName}.log
sonarErrorLog=${baseProjectPath}/issue/log/sonar/sonar-error-${projectName}.log

# shellcheck disable=SC2164
cd "${repoPath}"

"${sonarScannerHome}"sonar-scanner \
-Dsonar.projectKey="${projectName}"  \
-Dsonar.sources="${repoPath}" \
-Dsonar.projectVersion="${version}" \
-Dsonar.java.binaries="${repoPath}" \
-Dsonar.language=java  > "${sonarScannerLog}" 2> "${sonarErrorLog}"

cat "${sonarScannerLog}" >> ${baseProjectPath}/issue/log/sonar/sonar.log
result=$(cat "${sonarScannerLog}" | grep -E "EXECUTION SUCCESS")
errorResult=$(cat "${sonarErrorLog}" | grep -i -E "exception|error")

rm -f "${sonarScannerLog}"
rm -f "${sonarErrorLog}"

if [[ "${result}" == "" ]];then
#   echo "failed"
    exit 1
elif [ "${errorResult}" != ""  ]; then
    exit 2
fi
#echo "success"
exit 0


#sonar-scanner -Dsonar.projectKey=${projectName}  -Dsonar.sources=${repoPath} -Dsonar.projectVersion=${version} -Dsonar.java.binaries=${repoPath} > /home/fdse/user/issueTracker/bin/log/sonarScanner.log

#result=`cat /home/fdse/user/issueTracker/bin/log/sonarScanner.log | grep -E "EXECUTION SUCCESS"`
