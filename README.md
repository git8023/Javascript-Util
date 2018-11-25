# Javascript-Util
Javascript Util是在jQuery基础上提供部分插件, 浏览器内核以Chrome Google为主  
插件入口: `window.jsu`

- [Form: 表单控件](#表单控件)
- [Tree: 树控件](#树控件)

## 表单控件
通过`jsu.Form`实例对象获取/设置表单数据
- 获取实例
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
- Form.data(data?)  
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
- Form.clear()  
清空表单, 删除所有表单控件的值
- Form.restore()  
初始化: 表单控件的值恢复到获取`Form`对象时的状态
- Form.validation(es)  
表单校验  
  - 校验事件(es):
  ```javascript
  es = {
      success: function(res){console.log('校验成功')}, 
      failed: function(res){console.log('校验失败')}, 
      completed: function() {console.log('校验完成')} 
  }
  ```
  - 校验配置
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
- 获取实例
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
- Tree.init()  
初始化树控件   
- Tree.destroy()  
卸载树控件
- Tree.data(data?)  
指定data参数时设置数据, 无参数时获取数据
- Tree.expandNode(nodes?, dataKey?)  
参数**nodes**有值时指定展开节点, 如果没有值则获取已展开的节点;   
参数**dataKey**用于指定节点数据唯一值(Primary Key)的属性名;
- Tree.activateNode(nodes?, dataKey?)  
参数**nodes**有值时指定选中的节点, 如果没有值则获取展开的节点; 
如果节点数据为子节点控件自动展开父节点; 如果**nodes**为空数组时, 清空所有选中的节点;  
参数**dataKey**用于指定节点数据唯一值(Primary Key)的属性名;  
- Tree.events(es)  
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
