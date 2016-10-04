/*eslint-disable no-console */
var gulp = require("gulp");
var $ = require("gulp-load-plugins")(gulp);
var browserSync = require("browser-sync");
var del = require("del");
var yaml = require("js-yaml").safeLoad;
var sequence = require("run-sequence");
var fs = require("fs");
var moment = require("moment");
var highlight = require("highlight.js").highlightAuto;
var config = {
    CompileDir: "build", //开发编译目录
    SourceDir: "src", //源码目录
    DeploymentDir: "production" //编译到生产目录
};
var path = require("path");


//默认开发模式
gulp.task("default", ["dev"], function (cb) {
    return sequence(["serve", "watch"], cb);
});

gulp.task("clean", function () {
    return del([config.CompileDir, config.DeploymentDir, config.SourceDir + "/_md2html/*.*", config.SourceDir + "/includes/*.*", config.SourceDir + "/pagelist/*.*", config.SourceDir + "posts/*.*"]);
});
gulp.task("serve", function () {
    return browserSync.init({
        server: {
            baseDir: config.CompileDir
        },
        port: 8080,
        localhost: "127.0.0.1"
    });
});

gulp.task("dev", ["delCompileDir", "publishpagelist"], function (cb) {
    return sequence("html", "pug", "fileinclude", "sass", "js", "images", "jsx", "extend", cb);
});



gulp.task("delCompileDir", function (cb) {
    return del([config.CompileDir], cb);
});

gulp.task("reload", function (cb) {
    return sequence(["dev"], ["reload-browser"], cb);
});

gulp.task("reload-browser", function () {
    return browserSync.reload();
});

gulp.task("watch", function () {
    return gulp.watch([config.SourceDir + "/**/*.*", "!" + config.SourceDir + "/_**/*.*"], ["reload"]);
});


//compile jade
gulp.task("pug", function () {
    return gulp.src([config.SourceDir + "/**/*.{jade,pug}", "!" + config.SourceDir + "/_**/*.*"])
        .pipe($.plumber())
        .pipe($.changed(config.CompileDir, {
            extension: ".html"
        }))
        .pipe($.pug({
            pretty: true
        }))
        // .pipe(gulp.src(config.CompileDir + "/**/*.json"))
        // .pipe($.revCollector({ replaceReved: true }))
        .pipe(gulp.dest(config.CompileDir));
});

//compile html
gulp.task("html", function () {
    return gulp.src([config.SourceDir + "/**/*.{html,json}", "!" + config.SourceDir + "/_**/*.{html,json}"])
        .pipe(gulp.dest(config.CompileDir));
});

//compile sass
gulp.task("sass", function () {
    return gulp.src([config.SourceDir + "/**/*.{css,scss}", "!" + config.SourceDir + "/_**/_*.*"])
        .pipe($.changed(config.CompileDir, {
            extension: ".css"
        }))
        .pipe($.plumber())
        .pipe($.sass())
        .pipe($.autoprefixer([
            "Android 2.3",
            "Android >= 4",
            "Chrome >= 20",
            "Firefox >= 24",
            "Explorer >= 8",
            "iOS >= 6",
            "Opera >= 12",
            "Safari >= 6"
        ]))
        // .pipe($.rev())
        // .pipe($.revCollector({ replaceReved: true }))
        .pipe(gulp.dest(config.CompileDir));
    // .pipe($.rev.manifest())
    //.pipe(gulp.dest(config.CompileDir + "/cssversions"));
});

//compile jsx
gulp.task("jsx", function () {
    return gulp.src(config.SourceDir + "/**/*.jsx")
        .pipe($.plumber())
        .pipe($.changed(config.CompileDir, {
            extension: ".js"
        }))
        .pipe($.react())
        .pipe(gulp.dest(config.CompileDir));
});

//compile js
gulp.task("js", function () {
    return gulp.src(config.SourceDir + "/**/*.js")
        .pipe($.changed(config.CompileDir, {
            extension: ".js"
        }))
        .pipe(gulp.dest(config.CompileDir));
});

//images
gulp.task("images", function () {
    return gulp.src(config.SourceDir + "/**/*.{png,jpg,gif,svg}")
        .pipe($.plumber())
        .pipe($.changed(config.CompileDir))
        .pipe(gulp.dest(config.CompileDir));
});


//用于生产环境
gulp.task("deploy", ["delDeploymentDir","dev"], function () {
    return sequence(["imgmin"], ["cssmin"], ["jsmin"], ["htmlmin"]);
});
gulp.task("delDeploymentDir", function (cb) {
    return del([config.DeploymentDir], cb);
});


//压缩css
gulp.task("cssmin", function () {
    return gulp.src(config.CompileDir + "/**/*.{css,json}")
        // .pipe($.base64({
        //     baseDir: config.CompileDir,
        //     extensions: ["jpg", "jpeg", "png", "gif"],
        //     exclude: [/\.server\.(com|net)\/dynamic\//, "--live.jpg"],
        //     maxImageSize: 2 * 1024, // bytes 
        //     debug: true
        // }))
        .pipe($.css())
        .pipe($.rev())
        .pipe($.revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest(config.DeploymentDir))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.CompileDir + "/version/css"));
});


//压缩html
gulp.task("htmlmin", function () {
    return gulp.src(config.CompileDir + "/**/*.{html,json}")
        .pipe($.revCollector({
            replaceReved: true
        }))
        .pipe($.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest(config.DeploymentDir));
});


//压缩图片
gulp.task("imgmin", function () {
    return gulp.src(config.CompileDir + "/**/*.{png,jpg,gif,svg}")
        .pipe($.imagemin({})) //开发环境用起来太慢 打包生产环境时使用
        .pipe($.rev())
        .pipe(gulp.dest(config.DeploymentDir))
        // .pipe(upload({qn: qnOptions}))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.CompileDir + "/version/images"));
});


//压缩js

gulp.task("jsmin", function () {
    return gulp.src(config.CompileDir + "/**/*.{js,json}")
        .pipe($.plumber())
        .pipe($.revCollector({
            replaceReved: true
        }))
        .pipe($.uglify())
        .pipe($.rev())
        .pipe(gulp.dest(config.DeploymentDir))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.CompileDir + "/version/js"));
});

//雪碧图
gulp.task("sprite", ["deploy"], function () {
    // return gulp.src(config.CompileDir + "/**/*.css")
    //     // .pipe($.cssSpriter({
    //     //     // 生成的spriter的位置
    //     //     "spriteSheet": config.CompileDir + "/images/sprite.png",
    //     //     // 生成样式文件图片引用地址的路径
    //     //     // 如下将生产：backgound:url(../images/sprite20324232.png)
    //     //     "pathToSpriteSheetFromCSS": "/images/sprite.png"
    //     // }))
    //     .pipe($.spriter({
    //         sprite: "sprite.png",
    //         slice: "./" + config.CompileDir + "/images/",
    //         outpath: "./" + config.CompileDir + "/images/"
    //     }))
    //     //产出路径
    //     .pipe(gulp.dest(config.CompileDir));

    return gulp.src(config.DeploymentDir + "/**/*.css")
        .pipe($.spriter({
            sprite: "sprite.png",
            slice: "./" + config.DeploymentDir + "/images/",
            outpath: "./" + config.DeploymentDir + "/images/"
        }))
        .pipe(gulp.dest("."));
});

//gulp include

gulp.task("fileinclude", function () {
    gulp.src([config.SourceDir + "/**/*.html","!"+config.SourceDir + "/_**/*.html"])
        .pipe($.fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(config.CompileDir));
});
// 创建新文章
gulp.task("new", function () {
    //var reg=/^[\u4e00-\u9fa5]+$/;
    //  var title  = "";
    // if(reg.test(gulp.env["title"]))
    var title = gulp.env["title"] || "new";
    var tags = gulp.env["tags"] || "未添加标签";
    var categories = gulp.env["categories"] || "未添加分类";
    var now = (new Date()).toISOString().replace(/(.+)T(.+)\..+/, "$1 $2");
    var subtitle = gulp.env["subtitle"] || "";
    var outline = gulp.env["outline"] || "";
    return gulp.src("empty.md")
        .pipe($.replace(/\{date\}/g, now))
        .pipe($.replace(/\{title\}/g, title))
        .pipe($.replace(/\{subtitle\}/g, subtitle))
        .pipe($.replace(/\{categories\}/g, categories))
        .pipe($.replace(/\{tags\}/g, tags))
        .pipe($.replace(/\{outline\}/g, outline))
        .pipe($.rename((now.replace(/[: ]/g, "-")) + ".md"))
        .pipe(gulp.dest(config.SourceDir + "/posts"));
});

//创建栏目列表
var categorie = {};
var newarticlelist = [];
var tags = {};
gulp.task("includes", function () {
    return gulp.src(config.SourceDir + "/**/*.{md,markdown}")
        .pipe($.replace(/^([\S\s]+?)[\r\n]+?---[\r\n]/m, function ($0, $1) {
            var post = yaml($1);
            post.url = post.date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-") + ".html";
            newarticlelist.push(post);
            if (post.tags.length > 0) {
                for (var t in post.tags) {
                    tags[post.tags[t]] = true;
                }
            }
            if (categorie[post.categories]) {
                categorie[post.categories]++;
            } else {
                categorie[post.categories] = 1;
            }
            // console.log("-------------OK------------");
            // console.log(tags);

        }));
});


//生成列表
var pages;
var hash = {};
gulp.task("pagelist", function () {
    pages = [];
    return gulp.src(config.SourceDir + "/**/*.{md,markdown}")
        .pipe($.replace(/^([\S\s]+?)[\r\n]+?---[\r\n]/m, function ($0, $1) {

            // console.log($1);
            var post = yaml($1);
            post.url = post.date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-");
            pages.push(post);
           
            hash[post.url] = pages.length - 1;
            // console.log("-------------OK------------");
            // console.log(pages);
        }));
});


gulp.task("posts",["pagelist","buildMD"],function(){
    
    var posts = [];
    pages.sort(function (a, b) {
        return a.date - b.date;
    });
   for(var i=0;i<pages.length;i++)
   {
       var post = JSON.parse(JSON.stringify(pages[i]));

       var index = hash[post.url];
       var next =pages[index + 1];
       var prev =pages[index - 1];
         if (typeof (next) == "undefined") {
               next = {};
               next.url = "#";
               next.dis = "disabled";
            } else {
                next =  JSON.parse(JSON.stringify(pages[index + 1]));
                next.dis = "";
            }
            if (typeof (prev) == "undefined") {
                prev = {};
                prev.url = "#";
               prev.dis = "disabled";
            } else {
               prev =  JSON.parse(JSON.stringify(pages[index - 1]));
               prev.dis = "";
            }
           post.next = next;
           post.prev = prev;
             fs.writeFile(config.SourceDir+"/_md2html/"+post.url+".json",JSON.stringify(post),function(err){
                 if(!err)
                 {
                     console.log("ok");
                 }
             });
           posts.push(post);
         
   }
  // console.log(posts);
   //fs.writeFile(config.SourceDir+"/_md2html/"+"hehe"+".json",JSON.stringify(posts));
   fs.mkdir(config.SourceDir + "/_md2html", function (){
       
          for(var i=0;i<pages.length;i++)
   {
       var postfile = fs.readFileSync(config.SourceDir + "/post.html", "utf8");
      
       var mark= fs.readFileSync(config.SourceDir+"/_temp/"+pages[i].url+".html","utf8");
        postfile=  postfile.replace("@@markdown", mark);
      
      fs.writeFile(config.SourceDir+"/_md2html/"+pages[i].url+".html",postfile);
   }
   });
});


//生成文章静态页
gulp.task("buildMD", function () {
    var post;
    pages.sort(function (a, b) {
        return a.date - b.date;
    });
    // console.log(pages);
    return gulp.src(config.SourceDir + "/**/*.{md,markdown}")
        .pipe($.debug({
            title: "unicorn:"
        }))
        .pipe($.replace(/^([\S\s]+?)[\r\n]+?---[\r\n]/m, function ($0, $1) {
            post = yaml($1);
            post.title = post.title || post.date;
            post.subtitle = post.subtitle || "";
            post.url = post.date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-");
            post.subtitle;
            // posts.push(post);
            // debugger;
            return "";
        }))
        .pipe($.replace(/<!--[ \t]*?more[ \t]*?-->/, "<a id=more></a>"))
        .pipe($.marked({
            highlight: function (code) {
                return highlight(code).value;
            }
        }))
        .pipe($.replace(/<p>(.*?)<img src(.*?)>([\S\s]*?)<\/p>/gm, "<p class=img>$1<img src$2>$3</p>"))
        .pipe($.replace(/<a href="http(.*?)>"/g, "<a href='http$1' target=_blank>"))
        .pipe($.flatten())
        .pipe(gulp.dest(config.SourceDir + "/_temp/"));
});

gulp.task("extend",["posts"], function () {
    return gulp.src(config.SourceDir + '/_md2html/*.html')
        .pipe($.data(function (file) {
            return require("./"+config.SourceDir+'/_md2html/' + path.basename(file.path,".html") + '.json');
        }))
        .pipe($.template())
        .pipe(gulp.dest(config.CompileDir + "/posts"));
});


//生成文章列表页
gulp.task("publishpagelist", ["pagelist", "publish"], function () {
    return fs.mkdir(config.SourceDir + "/pagelist", function () {
        var pagelisthtml = "";
        var result = [];
        pages.sort(function (a, b) {
            return b.date - a.date;
        });
        for (var i = 0, len = pages.length; i < len; i += 5) {
            result.push(pages.slice(i, i + 5));
        }
        var page = 1;
        var pagelist = [];
        //正统分页
        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].length; j++) {
                var tagsinfo = "";
                for (var k = 0; k < result[i][j].tags.length; k++) {
                    tagsinfo += "<span class='label label-info'>" + result[i][j].tags[k] + "</span>";
                }
                var url = "/posts/" + result[i][j].date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-") + ".html";
                pagelist.push({
                    url: url,
                    tags: tagsinfo,
                    title: result[i][j].title,
                    small: result[i][j].subtitle,
                    date: moment(result[i][j].date).utc().format("YYYY-MM-DD"),
                    outline: result[i][j].outline
                });

            }
            if (page == 1) {
                fs.writeFile(config.SourceDir + "/_includes/list.json", JSON.stringify(pagelist));
            } else {
                var file = fs.readFileSync(config.SourceDir + "/index.html", "utf8");
                const str = "@@loop('_includes/list.html', \"_includes/list.json\")";
                var str2 = "@@loop('_includes/list.html', \"_includes/list" + page + ".json\")";
                const str3 = "";
                const str4 = "'../_includes/";
                file = file.replace(str, str2);
                file = file.replace(/'_includes\//g, str4);
                fs.writeFile(config.SourceDir + "/_includes/list" + page + ".json", JSON.stringify(pagelist));
                fs.writeFile(config.SourceDir + "/pagelist/page" + page + ".html", file);

            }

            pagelist.length = 0;
            page++;
        }

        var tagpages = [];
        pagelist.length = 0;
        for (var tag in tags) {
            for (var paga in pages) {
                if (pages[paga].tags.indexOf(tag) > -1) {
                    tagpages.push(pages[paga]);
                }
            }

            result.length = 0;
            page = 1;
            for (var i = 0, len = tagpages.length; i < len; i += 5) {
                result.push(tagpages.slice(i, i + 5));
            }
            //根据标签分页
            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < result[i].length; j++) {
                    var tagsinfo = "";
                    for (var k = 0; k < result[i][j].tags.length; k++) {
                        tagsinfo += "<span class='label label-info'>" + result[i][j].tags[k] + "</span>";
                    }
                    var url = "/posts/" + result[i][j].date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-") + ".html";
                    pagelist.push({
                        url: url,
                        tags: tagsinfo,
                        title: result[i][j].title,
                        small: result[i][j].subtitle,
                        date: moment(result[i][j].date).utc().format("YYYY-MM-DD"),
                        outline: result[i][j].outline
                    });
                }

                var file = fs.readFileSync(config.SourceDir + "/index.html", "utf8");
                const str = "@@loop('_includes/list.html', \"_includes/list.json\")";
                var str2 = "@@loop('_includes/list.html', \"_includes/" + tag + "list" + page + ".json\")";
                const str4 = "'../_includes/";
                const str3 = "@@loop('_includes/pagination.html',\"_includes/pagination.json\")"
                const str5 = "@@loop('_includes/pagination.html',\"_includes/"+tag+"pagination.json\")"
                file = file.replace(str, str2);
                file = file.replace(str3,str5);
                file = file.replace(/'_includes\//g, str4);
                fs.writeFile(config.SourceDir + "/_includes/" + tag + "list" + page + ".json", JSON.stringify(pagelist));
                fs.writeFile(config.SourceDir + "/pagelist/" + tag + "page" + page + ".html", file);
                pagelist.length = 0;
                page++;
            }
            tagpages.length = 0;
        }




        var categoriepages = [];
        for (var cat in categorie) {
            for (var paga in pages) {
                if (pages[paga].categories.indexOf(cat) > -1) {
                    categoriepages.push(pages[paga]);
                }
            }
            result.length = 0;
            page = 1;
            for (var i = 0, len = categoriepages.length; i < len; i += 5) {
                result.push(categoriepages.slice(i, i + 5));
            }
            //根据频道分页
            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < result[i].length; j++) {


                    var tagsinfo = "";
                    for (var k = 0; k < result[i][j].tags.length; k++) {
                        tagsinfo += "<span class='label label-info'>" + result[i][j].tags[k] + "</span>";
                    }
                    var url = "/posts/" + result[i][j].date.toISOString().replace(/(.+)T(.+)\..+/, "$1 $2").replace(/[: ]/g, "-") + ".html";
                  
                    pagelist.push({
                        url: url,
                        tags: tagsinfo,
                        title: result[i][j].title,
                        small: result[i][j].subtitle,
                        date: moment(result[i][j].date).utc().format("YYYY-MM-DD"),
                        outline: result[i][j].outline
                    });
                }
      
                var file = fs.readFileSync(config.SourceDir + "/index.html", "utf8");
                const str = "@@loop('_includes/list.html', \"_includes/list.json\")";
                var str2 = "@@loop('_includes/list.html', \"_includes/" + cat + "list" + page + ".json\")";
                const str3 = "@@loop('_includes/pagination.html',\"_includes/pagination.json\")"
                const str4 = "'../_includes/";
                const str5 = "@@loop('_includes/pagination.html',\"_includes/"+cat+"pagination.json\")"
                file = file.replace(str, str2);
                file = file.replace(str3,str5);
                file = file.replace(/'_includes\//g, str4);
                // console.log(file);
                fs.writeFile(config.SourceDir + "/_includes/" + cat + "list" + page + ".json", JSON.stringify(pagelist));
                fs.writeFile(config.SourceDir + "/pagelist/" + cat + "page" + page + ".html", file);
                pagelist.length = 0;
                page++;
            }
            categoriepages.length = 0;
        }

    });
});

gulp.task("publish", ["includes"], function () {

    return fs.mkdir(config.SourceDir + "/_includes", function () {


        //生成分页按钮
        var paginationhtml = "";
        var pageinations = [];
        var page = Math.ceil(newarticlelist.length / 5);
        for (var p = 1; p <= page; p++) {
            if (page == 1) {
                break;
            }

            if (p == 1) {
                pageinations.push({
                    url: "/index.html",
                    page: p
                });
                continue;
            }
            pageinations.push({
                url: "/pagelist/page" + p + ".html",
                page: p
            });
        }
        fs.writeFile(config.SourceDir + "/_includes/pagination.json", JSON.stringify(pageinations));


        //生成分类分页按钮
        var categoriepages = [];
        pageinations.length = 0;
        for (var cat in categorie) {

            //paginationhtml = "";
            for (var art in newarticlelist) {
                if (newarticlelist[art].categories.indexOf(cat) > -1) {
                    categoriepages.push(newarticlelist[art]);
                }
            }
            page = Math.ceil(categoriepages.length / 5);
            for (var p = 1; p <= page; p++) {

                if (page == 1) {
                    break;
                }
                pageinations.push({
                    url: "/pagelist/" + cat + "page" + p + ".html",
                    page: p
                });
            }
            fs.writeFile(config.SourceDir + "/_includes/" + cat + "pagination.json", JSON.stringify(pageinations));
            categoriepages.length = 0;
        }
        //生成标签分页按钮
        var tagspages = [];
        pageinations.length = 0;
        for (var tag in tags) {
            for (var art in newarticlelist) {
                if (newarticlelist[art].tags.indexOf(tag) > -1) {
                    tagspages.push(newarticlelist[art]);
                }
            }
            page = Math.ceil(tagspages.length / 5);
            for (var p = 1; p <= page; p++) {
                if (page == 1) {
                    break;
                }
                pageinations.push({
                    url: "/pagelist/" + tag + "page" + p + ".html",
                    page: p
                });
            }
            fs.writeFile(config.SourceDir + "/_includes/" + tag + "pagination.json", JSON.stringify(pageinations));
            tagspages.length = 0;
        }

        //生成栏目
        var cats = [];
        for (var s in categorie) {
            var cat = {
                catname: s,
                postcount: categorie[s],
                url:"/pagelist/"+s+"page1.html"
            };
          
            cats.push(cat);
        }
        newarticlelist.sort(function (a, b) {
            return b.date - a.date;
        });

        //生成最新文章链接
        newarticlelist.length = 10;
        var newarticlelisthtml = "";        var news = [];
        for (var o in newarticlelist) {
            news.push({
                url: "/posts/" + newarticlelist[o].url,
                title: newarticlelist[o].title,
                date: newarticlelist[o].date
            });
        }

        //生成标签云
        var tagjson = [];
        for (var tag in tags) {
            var index = Math.floor((Math.random() * "sml".length));
            tagjson.push({
                index:"sml"[index],
                tag: tag,
                url:"/pagelist/"+tag+"page1.html"
            });
        }
        fs.writeFile(config.SourceDir + "/_includes/categories.json", JSON.stringify(cats));
        fs.writeFile(config.SourceDir + "/_includes/newarticlelist.json", JSON.stringify(news));
        fs.writeFile(config.SourceDir + "/_includes/tags.json", JSON.stringify(tagjson));
    });
});