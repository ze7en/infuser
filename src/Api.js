var infuser = {
    storageOptions: {
        hash: hashStorage,
        script: scriptStorage
    },

    store: hashStorage,

    config: {
        templateUrl: "",
        templateSuffix: ".html",
        templatePrefix: ""
    },

    defaults: {
        domTargetResolver:  function(templateId) { return "#" + templateId }, // DEFAULT MAPPING
        loadingTemplate:    {
                                content:        '<div class="infuser-loading">Loading...</div>',
                                transitionIn:   function(target) {
                                                    var self = this;
                                                    $(target).hide();
                                                    $(target).html(self.content);
                                                    $(target).fadeIn();
                                                },
                                transitionOut:  function(target) {
                                                    $(target).html("");
                                                }
                            },
        postRender:         function(targetElement) { }, // NO_OP effectively by default
        preRender:          function(targetElement, template) { }, // NO_OP effectively by default
        render:             function(target, template) {
                                if($(target).children().length === 0) {
                                    $(target).append($(template));
                                }
                                else {
                                    $(target).children().replaceWith($(template));
                                }
                            },
        renderInstruction:  function(template, model) { return template; }, // NO_OP effectively by default
        useLoadingTemplate: true // true/false
    },

    get: function(templateId, callback) {
        var template = this.store.getTemplate(templateId),
            templatePath,
            options;
        if(!template || $.inArray(templateId, errors) !== -1) {
            templatePath = helpers.getTemplatePath(templateId);
            options = {
                        "async": true,
                        "url":templatePath,
                        "dataType": "html",
                        "type": "GET",
                        "success": helpers.templateGetSuccess(templateId, callback),
                        "error"  : helpers.templateGetError(templateId, templatePath, callback)
                      };
            trafficCop.direct(options);
        }
        else {
            callback(template);
        }
    },

    getSync: function(templateId) {
        var template = this.store.getTemplate(templateId),
            templatePath,
            templateHtml,
            options;
        if(!template || $.inArray(templateId, errors) !== -1) {
            templatePath = helpers.getTemplatePath(templateId);
            templateHtml = null;
            options = {
                        "async": false,
                        "url":templatePath,
                        "dataType": "html",
                        "type": "GET",
                        "success": function(response) { templateHtml = response;},
                        "error": function(exception) {
                            if($.inArray(templateId) === -1) {
                                errors.push(templateId);
                            }
                            templateHtml = returnErrorTemplate("HTTP Status code: exception.status", templateId, templatePath);
                        }
                      };
            $.ajax(options);
            if(templateHtml === null) {
                templateHtml = returnErrorTemplate("An unknown error occurred.", templateId, templatePath);
            }
            else {
                this.store.storeTemplate(templateId, templateHtml);
                template = this.store.getTemplate(templateId);
            }
        }
        return template;
    },

    infuse: function(templateId, renderOptions) {
        var self = this,
            options = $.extend({}, self.defaults, renderOptions),
            targetElement = options.targetSelector || options.domTargetResolver(templateId);
        if(options.useLoadingTemplate) {
            options.loadingTemplate.transitionIn(targetElement);
        }
        self.get(templateId, function(template) {
            var _template = template;
            options.preRender(targetElement, _template);
            _template = options.renderInstruction(_template, options.model);
            if(options.useLoadingTemplate) {
                options.loadingTemplate.transitionOut(targetElement);
            }
            options.render(targetElement, _template);
            options.postRender(targetElement);
        });
    }
};