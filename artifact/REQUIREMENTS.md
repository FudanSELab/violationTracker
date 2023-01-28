# Technology Skills Required

Evaluators are supposed to have basic skills to work with Docker and MySql as well as Linux terminals.

# Environment Required for Running the Artifact

**Hardware requirement**: 16GB RAM is suggested for running the artifact. However, ViolationTracker also passed the tests with only 4GB RAM when running with the accompanied example project. Typically, larger RAM supports larger software projects and longer evolution histories to be analyzed. 

Servers or workstations with mainstream CPUs should suffice.

Please prepare minimal 14GB free disk space (8GB for Docker and 6 GB for the artifact working directory). If you are planning to try ViolationTracker on more projects, please prepare more disk space. The reason of the disk space requirement is mainly for the sake of ease of use. The size of the core modules of ViolationTracker is about 90MB. It depends on SonarQube, MySql and MongoDB and requires certain configurations. To make the configurations easier, we decide to pack all dependencies, including SonarQube, MySql, and MongoDB, into Docker images so that the configurations can be almost automatic.

**Software requirement**: The artifact requires Linux-based OS with Docker support. We have tested the artifact under CentOS 7, Ubuntu Server 18.04.2, and Ubuntu Server 22.04.1. CentOS 7+ or Ubuntu Server 18+ should suffice.

Windows OS is *not* tested and may cause error due to different path separators used.

To makethe artifact work, Docker Engine and related components should be properlyinstalled. Make sure you have successfully installed Docker for CentOS or Ubuntu.

Please refer to INSTALL.md for installation instructions.

# Package dependencies

We rely mainly on MySql-5.7, Mongo-latest, SonarQube-8.9, Sonar-Scanner and Oracle JDK - 11.0.11.
MySql is used to store violation instances and matching data analyzed by ViolationTracker.
Mongo is used to cache full data from Automatic static analysis tools (ASATs) to speed up our analysis.
We use Sonar-Scanner to analyze the code repository, and Sonar-Scanner transmits the results of the analysis to SonarQube for parsing.
Finally, we get static defect instances through SonarQube's [Web Api](https://docs.sonarqube.org/latest/extension-guide/web-api/).
Oracle-jdk-11.0.11 jar used to run ViolationTracker.

In order to make our artifact easy to use, all dependencies are packed in the artifact package. Therefore, users are *not required* to install or configure the dependencies separately. 
