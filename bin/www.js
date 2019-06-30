#! /usr/bin/env node
const yargs = require('yargs')
console.log('ok')
console.log(process.cwd())   // 获取工作目录
let config = {
    cwd: process.cwd(),
    port: 8080
}
// 解析用户命令行参数，替换默认的配置
let options = yargs.option('port',{
    alias: 'p',
    default: 8080
}).argv
// 把用户传来的数据替换成配置
Object.assign(config, options)
// 启动服务
let MyServer = require('../Server')
let server = new MyServer(config)
server.start()