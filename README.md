# Javascript-Util
Javascript Util是在jQuery基础上提供部分插件, 浏览器内核以Chrome Google为主  
插件入口: `window.jsu`

- [Form: 表单控件](#表单控件)
- [Tree: 树控件](#树控件)
- [Pager: 分页条](#分页条)
- [Table: 表格](#表格)

## 表单控件
通过`jsu.Form`实例对象获取/设置表单数据
#### 获取实例
  ```javascript
  var 
      // 不限于<form />控件, 子控件包含有效的表单控件即可(input/select/textarea...)
      $form = $('.form'),
      // 如果启用mvvm模式, 可以通过修改数据直接控制表单控件
      mvvm = true,
      // 是否打印日志
      dev = true; 
  var form = new jsu.Form($form, mvvm, dev);
  ```
#### Form.data(data?)  
指定参数时设置数据, 无参数时获取数据.
  ```javascript
  // 获取数据
  var formData = form.data();
  // 如果开启mvvm模式该接口只需要调用一次, 后续数据获取或修改直接通过引用即可
  formData.text = 'bar';
  // 目前不支持复杂属性操作, formData.checkbox.push('foo'); 但可以通过手动 setter 来刷新
  formData.checkbox.push('foo');
  formData.checkbox = formData.checkbox;

  // 回填数据  
  // 自动忽略表单控件不存在的属性([name])
  form.data(formData);
  ```
#### Form.clear()  
清空表单, 删除所有表单控件的值
#### Form.restore()  
初始化: 表单控件的值恢复到获取`Form`对象时的状态
#### Form.validation(es)  
表单校验  
  #### 校验事件(es):
  ```javascript
  es = {
      success: function(res){console.log('校验成功')}, 
      failed: function(res){console.log('校验失败')}, 
      completed: function() {console.log('校验完成')} 
  }
  ```
  #### 校验配置
  ```html
  <!--正则表达式校验-->
  <input data-regexp="/^\S{6,18}$/" data-regexp-error="密码长度6~18位" >

  <!--相同值校验-->
  <input data-eq="[name='pwd']" data-eq-error="两次密码输入不一致" >
        
  <!--不同值校验-->
  <input data-not-eq="[name='username']" data-not-eq-error="密码不能与用户名相同" >
  
  <!--远程校验-->
  <!--暂未实现-->
  <input data-remote="/user/notExist" data-remote-error="用户名已存在" >

  <!--其他常规校验-->
  <input type="text" required="required" >
  <input type="text" minlength="3" maxlength="15" >
  <input type="number" min="1" step="0.5" max="100" >
  ```
## 树控件  
通过`jsu.Tree`展示/操作具有**树结构特性**的数据. 同时支持单根和多根数据结构.
#### 获取实例
  ```javascript
  var 
      // 树容器
      $tree = $('.container .tree'),
      // 自动初始化
      autoInit = true,
      // 是否打印日志
      dev = true; 
  var tree = new jsu.Tree($tree, autoInit, dev);
  ``` 
#### Tree.init()  
初始化树控件   
#### Tree.destroy()  
卸载树控件
#### Tree.data(data?)  
指定data参数时设置数据, 无参数时获取数据
#### Tree.expandNode(nodes?, dataKey?)  
参数**nodes**有值时指定展开节点, 如果没有值则获取已展开的节点;   
参数**dataKey**用于指定节点数据唯一值(Primary Key)的属性名;
#### Tree.activateNode(nodes?, dataKey?)  
参数**nodes**有值时指定选中的节点, 如果没有值则获取展开的节点; 
如果节点数据为子节点控件自动展开父节点; 如果**nodes**为空数组时, 清空所有选中的节点;  
参数**dataKey**用于指定节点数据唯一值(Primary Key)的属性名;  
#### Tree.events(es)  
注册事件:
   ```javascript
   tree.events({
       loaded: function () {
           logger.info('>>>>>>>>>>     加载完成', arguments);
       },
       destroyed: function () {
           logger.info('>>>>>>>>>>     卸载完成', arguments);
       },
       beforeAppend: function () {
           logger.info('>>>>>>>>>>     节点追加前', arguments);
           // return false;
       },
       afterAppend: function () {
           logger.info('>>>>>>>>>>     节点追加后', arguments);
       },
       updated: function () {
           logger.info('>>>>>>>>>>     更新完成,', arguments);
       },
       beforeExpand: function () {
           logger.info('>>>>>>>>>>     子节点展开前', arguments);
           // return false;
       },
       afterExpand: function () {
           logger.info('>>>>>>>>>>     子节点展开后', arguments);
       },
       beforeClose: function () {
           logger.info('>>>>>>>>>>     子节点关闭前', arguments);
       },
       afterClose: function () {
           logger.info('>>>>>>>>>>     子节点关闭后', arguments);
       }
   });
   ```
## 分页条
分页条`jsu.Pager`用于请求可分页的数据列表
#### HTML控件配置  
  ```html
  <!--data-url: 分页数据获取-->
  <!--data-reload: 点击相同页码是否发起请求-->
  <!--data-sizes: 页大小可选项, 默认第一项-->
  <!--data-count: 页码数量, 推荐为奇数-->
  <!-- 
      data-layout: 布局组件可自由配置, 与顺序无关
          total: 总页数组件
          sizes: 可选页码组件
          prev: 上一页组件
          next: 下一页组件
          jumper: 自由跳转组件
  -->
  <div class="pager"
       data-url='Page.jsp'
       data-reload='true'
       data-sizes='5,10,20,50,100'
       data-count='7'
       data-layout="total, sizes, prev, pager, next, jumper"></div>
  ```
#### 获取实例
  ```javascript
  var 
      // 分页条容器
      $pager = $('.pager'),
      // 自动初始化
      autoInit = true,
      // 调试日志
      dev = true;
  var pager = new jsu.Pager($pager, autoInit, dev);
  ```
#### Pager.init()  
手动初始化
#### Pager.destroy()  
销毁分页条控件
#### Pager.data(pagerData)  
设置分页条数据
  ```javascript
  pagerData = {
      // 总条数
      total: 20,
      // 当前页码
      index: 1
  }
  ```
#### Pager.index(pageIndex?)  
获取/设置当前页码
#### Pager.events(pagerEvents)  
  注册事件:
  ```javascript
  pager.events({
      loaded: function () {
          logger.info('>>> 加载完成', arguments);
      },
      before: function (index) {
          logger.info('>>> 跳转到指定页之前', arguments);
          return index;
      },
      formatter: function (resp) {
          logger.info('>>> 数据格式化', arguments);
          if (true === resp['flag'])
              return resp.data;
          logger.warn('服务器处理失败', resp);
          return {data: [], total: 0, index: 1};
      },
      after: function (data, conf) {
          logger.info('>>> 跳转到指定页之后', arguments);
      },
      destroyed: function () {
          logger.info('>>> 卸载之后', arguments);
      }
  });
  ```
## 表格
表格插件`jsu.Table`支持二维规整数据展示, 支持**列宽调整**、**列顺序调整**、**表头固定**、**左/右列固定**、**加载分页条**等操作
#### HTML控件配置
```html
<table class="table"
       data-pagination
       data-url='Page.jsp'
       data-reload='true'
       data-sizes='10,20,50,100'
       data-count='7'
       data-layout="total, sizes, prev, pager, next, jumper">
    <thead>
    <tr>
        <th data-type="index" data-text="索引"></th>
        <th data-type="expand" data-text="展开">
            <!-- 展开模板置于 [data-expand] 容器内部 -->
            <div data-expand>展开模板, 可嵌套任何内容</div>
        </th>
        <th data-type="selection" data-selection="checkbox" data-text="全选"></th>
        <th data-type="text" data-prop="name">文本</th>
        <th data-type="enum" data-prop="gender" data-enum='{"MALE":"男","FEMALE":"女"}'>枚举</th>
        <th data-type="date" data-prop="date" data-date-format="yyyy-MM-dd hh:mm:ss:S" data-text="注册时间"></th>
        <th data-type="html" data-prop="note">简介</th>
        <th data-type="html" data-prop="note" data-writable>编辑简介</th>
        <th data-type="date" data-prop="date" data-date-format="yyyy-MM-dd hh:mm:ss:S" data-writable>编辑注册时间</th>
        <th data-type="enum" data-prop="gender" data-writable data-enum='{"MALE":"男","FEMALE":"女"}' data-text="编辑性别">
            <div data-writable>
                <label>
                    <select name>
                        <option value="MALE">男</option>
                        <option value="FEMALE">女</option>
                    </select>
                </label>
            </div>
        </th>
        <th data-type="template" data-text="操作">
            <div data-template>
                <a href="javascript:" class="row-data">Get Data</a>
                <button class="update-name">Update Name</button>
            </div>
        </th>
    </tr>
    </thead>
</table>
```


#### 获取实例
  ```javascript
  var 
      // 表格容器
      $table = $('.table'),
      // 自动初始化
      autoInit = true,
      // 调试日志
      dev = true;
  var table = new jsu.Table($table, autoInit, dev);
  ```
#### Table.init()  
手动初始化
#### Table.destroy()  
销毁并还原控件
#### Table.data(data?)  
获取/设置表格数据
#### Table.actionRows(rows?)  
获取/设置选中的数据, 数据必须从**Table.data**()中获取.
#### Table.clearActions()  
清空选中的数据行
#### Table.events(tableEvents)  
注册事件
  ```javascript
  table.events({
     cellReady: function () {
         logger.info('cellReady', arguments);
     },
     rowReady: function () {
         logger.info('rowReady', arguments);
     },
     updated: function () {
         logger.info('updated', arguments);
     },
     mouseEnter: function () {
         logger.info('mouseEnter', arguments);
     },
     mouseLeave: function () {
         logger.info('mouseLeave', arguments);
     },
     click: function () {
         logger.info('click', arguments);
     },
     action: function () {
         logger.log('table action', arguments);
     },
     expandOpen: function (row, $container) {
         logger.info('expandOpen', arguments);
         // return false;
     },
     expandOpened: function (row, $container) {
         logger.info('expandOpened', arguments);
     },
     expandClose: function () {
         logger.info('expandClose', arguments);
         // return false;
     },
     expandClosed: function () {
         logger.info('expandClosed', arguments);
     }
  });
  ```
#### Table.paginationEvents(pagerEs)  
注册分页条事件, 需要**pagination**配置.  
参考: [Pager.events](#pagereventspagerevents)