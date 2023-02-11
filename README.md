# Purpose of ViolationTracker Artifact
ViolationTracker is a tool that automatically matches static analysis violations detected in adjacent revisions in Git repositories and builds precise full histories for all detected violations. The core algorithms of violation matching and tracking are implemented in the tool. The tool also contains a module to parse SonarQube scan results. But it essentially does not contain the static analysis functionality which is provided by SonarQube.

For the sake of ease of use, the ViolationTracker artifact integrates, besides the core modules for violation matching and tracking, all supporting environments such as SonarQube Community Version and other supporting environment such as required databases. The artifact only supports analyzing Java projects for the time being.
Therefore, this artifact provides with an end-to-end demonstration for building precise histories of static analysis violations. The input is Java projects in the format of Git repositories; the output is the violations detected by SonarQube with full histories. There are also querying functionalities available in the form of RESTful APIs or SQL queries. 

# Availability of the Artifact
The artifact is also permanently available on Zenodo with DOI [10.5281/zenodo.7571344](https://doi.org/10.5281/zenodo.7571344).

The main part of the artifact is the ViolationTracker packed file `icse-artifact.tar.gz`, which includes the core components of ViolationTracker and all dependencies in the form of docker images, along with several command line scripts for running the tool. It is however large (~1.5GB) and we are not able to store it freely on GitHub. Please find this file at Zenodo. 

# Replicate the results presented in the paper
Our artifact is carefully packed in Docker images containing all supporting environment and provided with step-by-step installation and running instructions. 

Although it is not feasible to replicate all results reported in the paper *ViolationTracker: Building Precise Histories for Static Analysis Violations* (to appear in ICSE 2023) within only 30 minutes, one may install and run the accompanied example with no difficulties. One may also use our tool to replicate all results by configuring SonarQube, MySQL Server, Mongo DB Server and other environment on his/her own computer (physical PC or Workstation or Server). You can refer to the INSTALL-DETAIL.md to configure the environment and run the tool. 

We attach the basic information of the code repositories analysed  in the paper, you can refer to documents REQUIREMENTS and INSTALL later to analyze the repositories.

|	projects	|	stars	|	start commit	|	address	|	branch	|	end commit	|
|-----------	|	-----------	|	-----------	|	-----------|	-----------	| -----------		|
|	cim	|	8.3k	|	ada019e689c63bd3c589df808cecaa53ed7ee3dd	|	https://github.com/crossoverJie/cim	|	master	|	6cff5a3feec06dc512112b5bcd85fae78f4fa505	|
|	jedis	|	10.4k	|	7e6ed0af4193c90473bbd25623e4067acea4115d	|	https://github.com/redis/jedis	|	master	|	31513d401aed1d2227e9388f178c3eaa39524832	|
|	jmeter	|	6k	|	59900b366206ebf24e771464bdbde1068930393a	|	https://github.com/apache/jmeter	|	master	|	5f0d39a2d6787840987e6c0ee9fdd2e7abc6db33	|
|	skywalking	|	19.1k	|	32b776de7321668df2d3a3ca614537eae33c40ad	|	https://github.com/apache/skywalking	|	master	|	1e117cf7191a3075fa160d72e6b6290339fbc714	|
|	curator	|	2.7k	|	1fade17a26b0b1e7d630f5b5ffbab298ecf5f1d6	|	https://github.com/apache/curator	|	master	|	5ca31e3520189fac3c0447e3083a76756a535723	|
|	spring-cloud-alibaba	|	22.1k	|	8142f3f4d79b2ab679a69c9d748e0ae61ce5934c	|	https://github.com/alibaba/spring-cloud-alibaba	|	2022.x	|	6f04a247fdc0789c9a635122e9738fd10941d45b	|


Our experiment was conducted on a server of Centos7 with the CPU Intel Xeon CPU E5-2620 v4 @ 2.10GHz and  64GB memory. We support simultaneous analysis of multiple repositories. In the case of analysing Jedis, Cim and Jmeter repositories at the same time, each repository uses three threads to prepare the violation data simultaneously. For the Jmeter repository (203,958 lines of code), we analysed 4,356 revisions and spent 4.76 hours. Of these, the Pre-Processing step accounts for 68.89\% of the time, the Matching Violation Instances step accounts for 0.25\% of the time, the Tracking Violation Cases step accounts for 17.17\% of the time, and the data persistence accounts for 13.70\%. Statistics for all projects are available on the  [here](https://github.com/FudanSELab/violationTracker/blob/master/resources/performance.jpg).

# BenchMark
## Benchmark for matching violation instances
Download the details in this [link](https://github.com/FudanSELab/violationTracker/blob/master/resources/Benchmark%20for%20matching%20violation%20instances.xlsx). 

The table consists of two tabs, the first tab is the benchmark of violation instances marked NEW and the second is those marked CLOSED.
The first tab contains table headers projects, commit, file_path, location_lines, type and detail.
The second tab contains table headers projects, commit, pre_commit, pre_file_path, pre_location_lines, type and detail.					
Note that if the column file_path/pre_file_path is empty, there is no NEW/CLOSED violation in the commit.


## Benchmark for Tracking violation cases
Download the details in this [link](https://github.com/FudanSELab/violationTracker/blob/master/resources/Benchmark%20for%20Tracking%20violation%20cases.xlsx). 
The table shows violation cases lifecycle, including the the first version information (commit, file_path, location_lines) and the threads (the quantity of threads, commits of threads start and end, the average days of the threads).
