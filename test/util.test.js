var jsdom = require('jsdom')

var initial_reqs = [
                '../lib/jquery-1.6.4.js',
                '../lib/mustache.js',
                '../lib/underscore-min.js',
                '../lib/smokesignals.min.js',
                '../lib/marimo.js'
                ]

exports.jsdom_wrapper = function(html, extra_reqs) {
    html = html || '<html><head></head><body><div id="one"></div><div id="two"></div></body>';
    reqs = initial_reqs;
    if (extra_reqs){
        reqs = reqs.concat(extra_reqs);
    }
    return function(cb) {
        var testcase = this
        jsdom.env(html, reqs,
             function(err, window) {
                window.$.ajax = function(url, settings) {
                    var success = settings.success
                    var error = settings.error
                    var data = this.data ? this.data : {}
                    if (this.should_fail) {
                        error(data)
                    }
                    else {
                        success(data)
                    }
                }
                window.marimo.init(window.$)

                testcase.window = window

                cb()
            }
        )
    }
}
