// Tiny static file server for the test tools (no dependencies).
// Usage from another script: const {url, close} = await serve(rootDir)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml'};

export function serve(root){
  return new Promise(res=>{
    const srv = http.createServer((req,resp)=>{
      const rel = decodeURIComponent(new URL(req.url,'http://x').pathname);
      const file = path.join(root, rel.endsWith('/') ? rel+'index.html' : rel);
      if(!file.startsWith(root)){resp.writeHead(403);return resp.end()}
      fs.readFile(file,(err,data)=>{
        if(err){resp.writeHead(404);return resp.end('not found')}
        resp.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});resp.end(data);
      });
    });
    srv.listen(0,'127.0.0.1',()=>res({url:`http://127.0.0.1:${srv.address().port}/`,close:()=>srv.close()}));
  });
}
