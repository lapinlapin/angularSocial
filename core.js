(function() {
    var app = angular.module('parseNews', []);

    app.filter('checkUrl', function() {
        return function(url) {
            return url ? url : '\u2718';
        };
    });

    app.directive('postsnewssocial', ['getSocData', function (socData) {
        return {
            restrict: 'E',
            templateUrl: 'post.html',
            scope: {
                sortField: '@'
            },
            link: function (scope, element, attrs) {
                var conf = {
                        0: 'vkNews',
                        1: 'fbId'
                    },
                    socials = ['Vk', 'Facebook'].forEach(function(socialType, i) {
                        socData.SocialFactory.factory(socialType).sendRequest(attrs[conf[i]]);
                    });

                scope.posts = socData.SocialFactory.news;
            },
            replace: true
        };
    }]);

    app.factory('getSocData', ['$http', function($http) {

        function SocialFactory() {}

        SocialFactory.prototype.sendRequest = function(paramFindNews) {
            this.options.getData(paramFindNews);
        }

        SocialFactory.news = [];

        SocialFactory.factory = function(socialType) {
            if (typeof SocialFactory[socialType].prototype.sendRequest !== 'function') {
                SocialFactory[socialType].prototype = new SocialFactory();
            }

            return new SocialFactory[socialType]();
        }

        SocialFactory.Vk = function() {
            this.options = {
                url: 'https://api.vk.com/',
                method: 'method/newsfeed.search?',
                news: 'q=',
                params: '+&count=50&extended=1&callback=JSON_CALLBACK',
                parseData: function (data) {

                    function parseUrl(text) {
                        var urlPostBegin = text.indexOf('http');

                        return text.slice(urlPostBegin, text.indexOf('.html', urlPostBegin) + 5);
                    }

                    data.response.splice(1).forEach(function(post) {
                        if (post.group && post.attachment) {
                            SocialFactory.news.push({
                                text: post.text,
                                like: post.likes.count,
                                reposts: post.reposts.count,
                                comments: post.comments.count,
                                name: post.group.name,
                                avatar: post.group.photo,
                                other: post.attachment.photo,
                                date: new Date(post.date * 1000).toLocaleString(),
                                url: parseUrl(post.text),
                                ico: 'vk.png'
                            });
                        }
                    });
                },
                getData: function (paramFindNews) {
                    var self = this;

                    this.news = this.news + paramFindNews;
                    $http.jsonp(this.url + this.method + this.news + this.params).success(function(data) {
                        self.parseData(data);
                    });
                }
            }
        }

        SocialFactory.Facebook = function() {
            this.options = {
                url: 'https://graph.facebook.com/v2.1/',
                id: '',
                params: '/?fields=feed.limit(10),picture&access_token=CAACEdEose0cBAN7f6yhCpZBKXbLfKVZBvMQUhRFBomJzpqKnZCXv82pZBGfHY6x0y9Hu921Em6LMDv4uNL7VzGY802bH3ZAEv8Ci71zMdNo0i5C47WcSZCud6Ra6PnrXF6wDbLdWKrXjbMdD4qwlCbpoy9ZCr21NKesZCKpULIP0sYo5YFVGThlIhmHQXHhZAm5vBEd3dA7ZA7wy0g0aYcSAto&format=json',
                parseData: function(data) {

                    function parseTime(date) {
                        date = date.slice(0, date.length - 5).split('T');

                        return date[0] + ', ' + date[1];
                    }

                    data.feed.data.forEach(function(post) {
                        SocialFactory.news.push({
                            text: post.message,
                            like: post.likes && post.likes.data.length || 0,
                            reposts: post.shares && post.shares.count || 0,
                            comments: post.comments && post.comments.data.length || 0,
                            avatar: data.picture.data.url,
                            name: post.from && post.from.name,
                            other: {
                                src_big: post.picture
                            },
                            url: post.link,
                            date: parseTime(post.updated_time),
                            ico: 'fb.png'
                        });
                    });
                },
                getData: function (paramFindNews) {
                    var self = this;

                    this.id = paramFindNews;
                    $http.get(this.url + this.id + this.params).success(function(data) {
                        self.parseData(data);
                    });
                }
            }
        }

        return {
            SocialFactory: SocialFactory
        }
    }]);
})();
