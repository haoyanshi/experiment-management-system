#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
实验管理系统 - Python 简单服务器启动脚本
适用于没有 Node.js 环境的情况
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def main():
    # 切换到脚本所在目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 服务器配置
    PORT = 8080
    Handler = http.server.SimpleHTTPRequestHandler
    
    print("=====================================")
    print("🧪 实验管理系统 - Python 服务器")
    print("=====================================")
    print(f"📋 访问地址: http://localhost:{PORT}")
    print(f"📁 服务目录: {script_dir}")
    print("🛑 按 Ctrl+C 停止服务器")
    print("=====================================")
    print("⚠️  注意: 这是一个简单的HTTP服务器")
    print("   建议使用 Node.js 版本获得更好的体验")
    print("=====================================")
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"✅ 服务器已启动在端口 {PORT}")
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 已尝试在浏览器中打开页面")
            except:
                print("🌐 请手动在浏览器中打开 http://localhost:8080")
            
            print("🟢 服务器运行中...")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n📴 正在关闭服务器...")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {PORT} 已被占用")
            print("💡 请关闭其他占用该端口的程序，或修改端口号")
        else:
            print(f"❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()