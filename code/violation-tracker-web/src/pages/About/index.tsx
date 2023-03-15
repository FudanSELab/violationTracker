import { Card, Tag } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import BackButton from '../../components/BackButton';

const About: React.FC = () => {
  return (
    <div>
      <div className={'issloca'}>
        <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
          <BackButton />
          <span>{intl.get('version explain')}</span>
        </div>
      </div>
      <div id="aboutPage" style={{ margin: '20px auto', width: '70%' }}>
        <Card style={{ marginBottom: '2rem' }}>
          <p>
            当前分支版本：<Tag color="blue">{process.env.REACT_APP_BRANCH}</Tag>
          </p>
          <p>当前版本号：{process.env.REACT_APP_VERSION}</p>
          <h1>Version1.5-2021年10月29日</h1>
          <ol>
            <li>"CodeWisdom"名字改为"CodeWisdom代码大数据平台"</li>
            <li>人员总览页面改为笑脸视图以及优化评分系统</li>
            <li>设置添加评分标准管理功能以及各个库评分标准修改功能</li>
            <li>添加项目总览页面重命名循环依赖中的文件数功能</li>
            <li>添加循环依赖文件数总览表格添加时间搜索功能</li>
            <li>添加循环依赖文件数总览前端实现文件列表展示</li>
            <li>添加依赖关系图展示</li>
            <li>添加超大文件数总览最后更改时间排序功能</li>
            <li>实现用户合并功能</li>
            <li>项目添加设置生命周期功能</li>
            <li>缺陷总览表格详情添加内容</li>
            <li>缺陷追溯GitGraph可视化升级以及优化</li>
            <li>GitGraph添加展示完整或不完整追溯的选项</li>
            <li>sidebar可视化优化</li>
            <li>修复工作焦点时间范围默认为周而不是年的问题</li>
            <li>修复静态缺陷跳转不正确问题</li>
            <li>修复开发者能力缺陷详情弹出框无法正常显示的问题</li>
            <li>修复项目总览扫描表格项目度量详情趋势统计弹出框的问题</li>
            <li>修复开发人员画像页面缺陷列表无法展示全部的问题</li>
          </ol>
          <h1>Version1.4-2021年4月29日</h1>
          <ol>
            <li>超大文件折线图、总览及下载功能</li>
            <li>提交规范性折线图、总览及下载功能</li>
            <li>克隆组数折线图、总览</li>
            <li>循环依赖组数折线图、总览、下载功能</li>
            <li>
              针对JS语言的代码库扫描，支持读取.eslintignore文件并过滤需要忽略的缺陷
            </li>
          </ol>
          <h1>Version1.3-2021年4月1日</h1>
          <ol>
            <li>更新高圈复杂度折线图</li>
            <li>更新高频修改文件折线图及总览</li>
            <li>支持JS语言的代码行、issue数等扫描能力</li>
            <li>优化了issue扫描和映射，使得issue数据更加准确</li>
            <li>修复了一些Bug</li>
          </ol>
          <h1>Version1.2-2021年1月21日</h1>
          <ol>
            <li>重复字符串的缺陷优先级降低</li>
            <li>缺陷总览选择项目后，引入者仅显示这个项目下引入过缺陷的人</li>
            <li>支持邮箱登录平台</li>
            <li>缺陷列表的默认排序先按状态、再按时间</li>
            <li>忽略完成后刷新列表</li>
            <li>开发者能力每个数据加解读（解释）</li>
            <li>项目列表显示每次扫描耗时</li>
            <li>项目列表增加负责人，支持按负责人筛选</li>
            <li>权限管理，超管可以对项目负责人进行编辑</li>
            <li>如果提交规范性的分母为0，显示“无提交”</li>
            <li>解决EHR项目issue数目不对的问题</li>
          </ol>
          <h1>Version1.1-2020年12月22日</h1>
          <ol>
            <li>针对缺陷总览增加导出excel功能</li>
            <li>项目总览现在可以按项目聚合</li>
            <li>解决了页面返回可用性差的问题</li>
            <li>支持缺陷忽略</li>
            <li>解决缺陷跳转有时会出现无数据的情况</li>
            <li>缺陷总览的缺陷详情中，加入缺陷出现的版本和位置信息</li>
            <li>解决提交规范性数据不准确的问题</li>
            <li>缺陷总览筛选项筛选后允许回到all状态</li>
            <li>缺陷总览缺陷分类边栏点击后允许回到all状态</li>
            <li>优化缺陷追溯页的前端显示</li>
            <li>开发者排行报告radio问题修复</li>
            <li>解决总提交次数有误的问题</li>
            <li>优化工作焦点无数据时的提示</li>
            <li>解决代码库详情模态框缺少部分数据的问题</li>
            <li>支持新增项目</li>
            <li>支持修改项目名称</li>
            <li>支持修改代码库所属项目</li>
            <li>支持修改代码库名称</li>
            <li>添加重复代码库时页面提示无法添加</li>
            <li>解决项目总览的活跃度和缺陷的时间范围不可切换</li>
            <li>解决项目总览项目名称和库名称为空的bug</li>
            <li>解决追溯页面的commit调用链出现重复的bug</li>
          </ol>
        </Card>
      </div>
    </div>
  );
};

export default About;
