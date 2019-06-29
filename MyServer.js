let http = require('http')
let url = require('url')
let fs = require("fs").promises
let path = require("path")
let { createReadStream } = require('fs')
let mime = require('mime')
let zlib = require('zlib')

// 解决this问题可以通过bind方法来解决
class Server {
    start(){
        let server = http.createServer(this.handleRequest.bind(this))
        server.listen(...arguments)
    }
    async handleRequest(req, res){
        let { pathname } = url.parse(req.url)
        let absPath = path.join(__dirname,pathname)
        try{
            // 判断路径是否存在
            let stat = await fs.stat(absPath)
            if (stat.isDirectory()) {
                absPath = path.join(absPath,"index.html")
                await fs.access(absPath)
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

// 开启一个服务
let server = new Server();
server.start(3000)