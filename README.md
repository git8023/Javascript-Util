# Javascript-Util
Javascript Util是在jQuery基础上提供部分插件, 浏览器内核以Chrome Google为主  
插件入口: `window.jsu`

- Form: 表单控件
- Tree: 树控件

## 表单控件
通过`jsu.Form`实例对象获取/设置表单数据
- 获取实例
```javascript
var 
    // 不限于<form />控件, 子控件包含有效的表单控件即可(input/select/textarea...)
    $form = $('.form'),
    // 如果启用mvvm模式, 可以通过修改数据直接控制表单控件
    activeMvvmModel = true,
    // 是否打印日志
    showLog = true; 

// 获取Form对象
var form = new jsu.Form($form, activeMvvmModel, showLog);
```

- 获取数据  
获取当前表单中实时数据
```javascript
var formData = form.data();
// 如果开启mvvm模式该接口只需要调用一次, 后续数据获取或修改直接通过引用即可
formData.text = 'bar';
// 目前不支持复杂属性操作, formData.checkbox.push('foo'); 但可以通过手动 setter 来刷新
formData.checkbox.push('foo');
formData.checkbox = formData.checkbox;
```

- 回填数据  
自动忽略表单控件不存在的属性([name])
```javascript
form.data(formData);
```

- 清空与初始化  
  - 清空: 删除所有表单控件的值
  - 初始化: 表单控件的值恢复到获取`Form`对象时的状态
```javascript
// 清空数据
form.clear();
// 初始化
form.restore();
```
