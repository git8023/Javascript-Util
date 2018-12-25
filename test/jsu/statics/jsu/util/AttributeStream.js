/* ************************************
 * AttributeStream 属性流接口(抽象类)
 * ************************************/
;(function (c) {

    'use strict';
    c.AttributeStream = AttributeStream;
    AttributeStream.logger = c.Logger ? new c.Logger('AttributeStream') : null;

    // K-属性流处理器唯一值
    // V-属性流处理器类
    AttributeStream.typeStorage = {};

    // K-属性流处理器唯一值
    // V-{discern:{function(o):boolean}, context:? extends AttributeStream}
    AttributeStream.discernStorage = {};

    /**
     * 数据流同步处理类
     * @param obj {Array|Object} 目标对象
     * @constructor
     */
    function AttributeStream(obj) {
        this.target = obj;
        this._next = null;
        this.handler = null;
    }

    /**
     * 注册节点获取器, Object默认使用可枚举属性遍历, Array通过length属性遍历
     * @param nextFn {function(node:AttributeNode):?node|undefined} 下个流节点, 返回undefined中断
     * @return {AttributeStream}
     */
    AttributeStream.prototype.next = function (nextFn) {
        return this;
    };

    /**
     * 注册节点处理器
     * @param handler {function(node:AttributeNode):?boolean} 处理器, 返回false中断
     * @return {AttributeStream}
     */
    AttributeStream.prototype.handle = function (handler) {
        return this;
    };

    /**
     * 对象类型识别
     * @param obj {*} 目标对象
     * @return {boolean} true-可以处理该对象, false-不能处理该对象
     */
    AttributeStream.prototype.discern = function (obj) {
        return false;
    };

    /**
     * 开始处理
     */
    AttributeStream.prototype.start = function () {
        var node;
        while ((node = this.next())) {

        }
    };

    /**
     * 注册流处理器实例
     * @param attributeStreamClass {AttributeStream} AttributeStream子类实现
     * @return {AttributeStream}
     */
    AttributeStream.registration = function (attributeStreamClass) {
        return AttributeStream;
    };

    /**
     * 创建属性流对象, 根据不同的目标对象使用不同的实现
     * @param obj {Array|Object} 目标对象
     */
    AttributeStream.create = function (obj) {
        return new AttributeStream(obj);
    }
})(window.jsu = (window.jsu || {}));


/* ************************************
 * ObjectAttributeStream 对象属性流
 * ************************************/
(function (c) {

    'use strict';
    c.ObjectAttributeStream = ObjectAttributeStream;
    ObjectAttributeStream.logger = c.Logger ? new c.Logger('AttributeStream') : null;

    /**
     * 数据流同步处理类
     * @param obj {Array|Object} 目标对象
     * @constructor
     */
    function ObjectAttributeStream(obj) {
        var args = c.common.argumentsAsArray(arguments);
        c.AttributeStream.apply(this, args);
    }

    ObjectAttributeStream.prototype = new c.AttributeStream(null);


    /**
     * 注册节点获取器, Object默认使用可枚举属性遍历, Array通过length属性遍历
     * @param nextFn {function(node:AttributeNode):?node|undefined} 下个流节点, 返回undefined中断
     * @return {AttributeStream}
     */
    ObjectAttributeStream.prototype.next = function (nextFn) {
        return this;
    };

    /**
     * 注册节点处理器
     * @param handler {function(node:AttributeNode):?boolean} 处理器, 返回false中断
     * @return {AttributeStream}
     */
    ObjectAttributeStream.prototype.handle = function (handler) {
        return this;
    };

    /**
     * 对象类型识别
     * @param obj {*} 目标对象
     * @return {boolean} true-可以处理该对象, false-不能处理该对象
     */
    ObjectAttributeStream.prototype.discern = function (obj) {
        return false;
    };
})(window.jsu = (window.jsu || {}));


/* ************************************
 * AttributeNode 属性节点
 * ************************************/
(function (c) {

    'use strict';
    c.AttributeNode = AttributeNode;
    AttributeNode.logger = c.Logger ? new c.Logger('AttributeStream') : null;

    function AttributeNode() {
    }

})(window.jsu = (window.jsu || {}));

