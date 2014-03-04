(function () {
    var util = {
        createShadowRoot: function (element) {
            var prefixs = ['', 'webkit', 'moz', 'ms'];
            var funcName;
            for (var i = 0, l = prefixs.length; i < l; i++) {
                funcName = prefixs[i] + (prefixs[i] ? 'C' : 'c') + 'reateShadowDom';
                if (typeof element[funcName] === 'function') {
                    return element[funcName]();
                }
            }
        },

        extend: function (target, src) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) {
                    target[staticMethod] = src[staticMethod];
                }
            }
        },

        /**
         * bind event
         *
         * @param {Element} element .
         * @param {string} event .
         * @param {Function} callback .
         */
        bind: function (element, event, callback) {
            if (element.addEventListener) {
                element.addEventListener(event, callback, false);
            } else {
                element.attachEvent('on' + event, callback);
            }
        },

        /**
         * 检查input是否支持type="file"
         */
        supportFileInput: function () {
            var input = document.createElement('input'),
                support = false;
            input.type = 'file';
            // ios < 6, 会设置input为disabled
            if (input.type === 'file' && !input.disabled) {
                support = true;
            }
            this.supportFileInput = function () {
                return support;
            };
            return support;
        },

        /**
         * 是否支持drag和drop
         *
         */
        supportDrag: function () {
            var div = document.createElement('div');
            var support = ('draggable' in div)
                || ('ondragstart' in div && 'ondrop' in div);
            this.supportDrag = function () {
                return support;
            };
            return support;
        },

        /**
         * 是否支持xhr
         */
        supportXhr: function () {
            var input = document.createElement('input');
            var support;
            input.type = 'file';
            support = (
                'multiple' in input &&
                'files' in input &&
                    typeof File != "undefined" &&
                    typeof FormData != "undefined" &&
                    typeof (new XMLHttpRequest()).upload != "undefined" );

            this.supportXhr = function () {
                return support;
            };
            return support;
        },

        /**
         * 如果数组中没有push进去
         */
        pushIfNotExist: function (array, id) {
            var i = 0;
            var l = array.length;
            var existed = false;
            for (; i<l; i++) {
                if (array[i] === id) {
                    existed = true;
                    break;
                }
            }

            if (!existed) {
                array.push(id);
            }
            return existed;
        },

        /**
         * 如果数组中有就移除
         */
        removeIfExist: function (array, id) {
            var i = 0;
            var l = array.length;
            for (; i<l; i++) {
                if (id === array[i]) {
                    array.splice(i, 1);
                    return true;
                }
            }
            return false;
        },

        parseByType: function (input, type) {
            switch (type) {
                case 'string':
                    return input;
                case 'boolean':
                    return input !== 'false';
                case 'number':
                    return parseInt(input, 10);
                default:
                    return input;
            }
        }
    };
    var optionKeys = [];

    function ShadowUploader(element, option) {
        this.host = element;
        this.root = util.createShadowRoot(element);
        if (!this.root) {
            this.root = this.host;
            this.noShadowDom = true;
            this.content = this.root.innerHTML;
            this.root.innerHTML = '';
        }

        this._option = util.extend(this._createOption(), option);
    }

    ShadowUploader.prototype._createOption = function () {
        var option = {
            'url': '.',
            'handleAs': 'json',
            'name': 'uploader',
            'maxCount': 10,
            'maxConnection': 2,
            'uploadOnChange': true
        };
        var value;
        for (var key in option) {
            value = this.host.getAttribute('data-' + key);
            if (value != null) {
                option[key] = parseByType(value, typeof(option[key]));
            }
        }

        return option;
    };

    /**
     * 设置上传按钮
     */
    ShadowUploader.prototype._setupButton = function() {
        var that = this;
        var fileInput = that.fileInput = document.createElement('input');
        fileInput.pseudo = 'file-input';
        fileInput.type = 'file';
        fileInput.name = that.option.name;
        if (util.supportXhr()) {
            fileInput.multiple = true;
        }

        fileInput.onchange = function onchangeCallback(e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            // clone and replace it
            var next = target.nextSibling;
            var parent = target.parentNode;
            var clone = target.clone();
            parent.removeChild(target);
            parent.insertBefore(clone, next);

            // add input
            id = that._addUpload(this);
            // autoUpload on change
            if (that._option.uploadOnChange) {
                that.upload(id);
            }

            clone.onchange = onchangeCallback;
        };
    };

    /**
     * 设置拖动上传区域
     */
    ShadowUploader.prototype._setupDrag = function() {
        var that = this;
        if (!util.supportDrag() ||
            !util.supportXhr()) {
            return;
        }

        var dragArea = that.dragArea = document.createElement('div');
        dragArea.pseudo = 'drag-area';
        dragArea.innerHTML = 'Drop and upload';
        dragArea.draggable = true;
        that.root.appendChild(dragArea);
        util.bind(dragArea, 'dragenter', function() {
            dragArea.pseudo = 'drag-area-enter';
        });
        util.bind(dragArea, 'dragleave', function(e) {
            dragArea.pseudo = 'drag-area';
        });
        util.bind(dragArea, 'drop', function(e) {
            e.preventDefault();
            dragArea.pseudo = 'drag-area';
            var i = 0;
            var fileList = e.originalEvent.dataTransfer.files;
            var l = fileList.length;
            var file;
            var id;
            for (; i<l; i++) {
                file = fileList[i];
                id = that._addOneUpload(file);
                if (that._option.uploadOnChange) {
                    that.upload(id);
                }
            }
        });
    };

    ShadowUploader.prototype._setupFileList = function() {
        var fileList = that.fileList = document.createElement('ul');
        fileList.presudo = 'file-list';
    };

    ShadowUploader.prototype._init = function () {
        this.root.innerHTML = ''
            + '<style>'
            +   '* {color: blue;}'
            + '</style>';
        this._setupButton();
        this._setupDrag();
        this._setupFileList();
    };
})();
