let http = require('http')
let url = require('url')
let fs = require("fs").promises
let path = require("path")
let { createReadStream, readFileSync } = require('fs')
let mime = require('mime')
let zlib = require('zlib')
let ejs = require('ejs')
let chalk = require('chalk')
let template = readFileSync(path.resolve(__dirname, 'template.ejs'), 'utf8')
// 解决this问题可以通过bind方法来解决
module.exports = class Server {
    constructor(config) {
        // 类中用到的属性都需要挂在当前的实例上
        this.template = template
        this.config = config
    }
    start(){
        let server = http.createServer(this.handleRequest.bind(this))
        server.listen(this.config.port, () => {
            console.log(` ${chalk.yellow('Successful start-up $')} \n http://127.0.0.1:${chalk.green(this.config.port)}`)
        })
    }
    async handleRequest(req, res){
        let { pathname } = url.parse(req.url)
        let absPath = path.join(this.config.cwd,pathname)
        try{
            // 判断路径是否存在
            let stat = await fs.stat(absPath)
            if (stat.isDirectory()) {
                absPath = path.join(absPath,"index.html")
                try{
                    await fs.access(absPath)
                }catch(e) {
                    // 没有index.html,获取整个目录的path
                    let dirPath = path.dirname(absPath)
                    // 读取目录
                    let dirs = await fs.readdir(dirPath)
                    console.log(dirs)
                    let currentPath = pathname.endsWith('/') ? pathname : pathname + '/'
                    // 渲染界面
                    let template = ejs.render(this.template, {currentPath, arr: dirs})
                    res.setHeader("Content-Type", "text/html;charset=utf-8")
                    res.end(template)
                    return 
                }
            } 
            this.sendFile(absPath,req,res)
        } catch(err) {
            console.log(err)
            this.sendError(err,req,res)
        }
    }
    sendError(err,req,res) {
        res.statusCode = 404
        res.end(`not Found`)
    }
    sendFile(absPath,req,res) {
        // 获取浏览器支持的压缩方法
        let acceptEncoding = req.headers['accept-encoding']
        res.setHeader("Content-Type",mime.getType(absPath)+ ";charset=utf-8")
        let raw = createReadStream(absPath)
        console.log(acceptEncoding)
        if (acceptEncoding.includes('gzip')) {
            // 流的原理，默认调用可写流的write和end方法
            res.setHeader('Content-Encoding', 'gzip')
            raw.pipe(zlib.createGzip()).pipe(res)
        } else if (acceptEncoding.includes('deflate')) {
            // 流的原理，默认调用可写流的write和end方法
            res.setHeader('Content-Encoding', 'deflate')
            raw.pipe(zlib.createDeflate()).pipe(res)
        } else {
            raw.pipe(res)
        }
    }
}
