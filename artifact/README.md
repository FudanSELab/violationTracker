# Purpose of the Research Artifact

ViolationTracker is a tool that automatically matches static analysis violations detected in adjacent revisions in Git repositories and builds precise full histories for all detected violations. The core algorithms of violation matching and tracking are implemented in the tool. The tool also contains a module to parse SonarQube scan results. But it essentially does not contain the static analysis functionality which is provided by SonarQube.
For the sake of ease of use, the ViolationTracker artifact integrates, besides the core modules for violation matching and tracking, all supporting environments such as SonarQube Community Version and other supporting environment such as required databases. The artifact only supports analyzing Java projects for the time being.
Therefore, this artifact provides with an end-to-end demonstration for building precise histories of static analysis violations. The input is Java projects in the format of Git repositories; the output is the violations detected by SonarQube with full histories. There are also querying functionalities available in the form of SQL queries. 

# Obtaining the artifact

The artifact is permanently available on Zenodo.  It is also available at [FudanSELab/violationTracker (github.com)](https://github.com/FudanSELab/violationTracker) website.

The main part of the artifact is the ViolationTracker packed file `icse-artifact.tar.gz`, which includes the core components of ViolationTracker and all dependencies in the form of docker images, along with several command line scripts for running the tool. Please refer to INSTALL.md to install and run ViolationTracker with the accompanied open source project or other Java projects you have at hand.

# Replicate the results presented in the paper

Our artifact is carefully packed in Docker images containing all supporting environment and provided with step-by-step installation and running instructions. 

Although it is not feasible to replicate all results reported in the paper *ViolationTracker: Building Precise Histories for Static Analysis Violations* (icse23main-p2422) within only 30 minutes, one may install and run the accompanied example with no difficulties. One may also use our tool to replicate all results by configuring SonarQube, MySQL Server, Mongo DB Server and other environment on his/her own computer (physical PC or Workstation or Server). 

We attach the basic information of the code repositories analysed in the paper, which is useful for replicating the experiments. Our GitHub repository is located at [FudanSELab/violationTracker (github.com)](https://github.com/FudanSELab/violationTracker) for further references.

| projects             | stars | start commit                             | address                                         | branch | end commit                               |
| -------------------- | ----- | ---------------------------------------- | ----------------------------------------------- | ------ | ---------------------------------------- |
| cim                  | 8.3k  | ada019e689c63bd3c589df808cecaa53ed7ee3dd | https://github.com/crossoverJie/cim             | master | 6cff5a3feec06dc512112b5bcd85fae78f4fa505 |
| jedis                | 10.4k | 7e6ed0af4193c90473bbd25623e4067acea4115d | https://github.com/redis/jedis                  | master | 31513d401aed1d2227e9388f178c3eaa39524832 |
| jmeter               | 6k    | 59900b366206ebf24e771464bdbde1068930393a | https://github.com/apache/jmeter                | master | 5f0d39a2d6787840987e6c0ee9fdd2e7abc6db33 |
| skywalking           | 19.1k | 32b776de7321668df2d3a3ca614537eae33c40ad | https://github.com/apache/skywalking            | master | 1e117cf7191a3075fa160d72e6b6290339fbc714 |
| curator              | 2.7k  | 1fade17a26b0b1e7d630f5b5ffbab298ecf5f1d6 | https://github.com/apache/curator               | master | 5ca31e3520189fac3c0447e3083a76756a535723 |
| spring-cloud-alibaba | 22.1k | 8142f3f4d79b2ab679a69c9d748e0ae61ce5934c | https://github.com/alibaba/spring-cloud-alibaba | 2022.x | 6f04a247fdc0789c9a635122e9738fd10941d45b |

Our experiment was conducted on a server of Centos7 with the CPU Intel Xeon CPU E5-2620 v4 @ 2.10GHz and  64GB memory. Although our artifact may run with much lower configurations, analysing large repositories at the same time needs a workstation or server with similar configurations as ours. ViolationTracker is designed to support simultaneous analysis of multiple repositories. For example, in the case of analysing Jedis, Cim and Jmeter repositories at the same time, each repository uses three threads to prepare the violation data simultaneously. According to our log records for the Jmeter repository (203,958 lines of code), we analysed 4,356 revisions in 4.76 hours. The Pre-Processing step took 68.89\% of all elapsed time, the Matching Violation Instances step took 0.25\%, the Tracking Violation Cases step took 17.17\%, and data persistence took 13.70\%. Statistics for all projects are available on our website [FudanSELab/violationTracker (github.com)](https://github.com/FudanSELab/violationTracker).
