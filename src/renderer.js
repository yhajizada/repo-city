(function () {
  'use strict';
  const C = RepoCityCore;
  class CityRenderer {
    constructor(canvas, onSelect, onHover) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.onSelect = onSelect; this.onHover = onHover;
      this.scale = 1; this.pan = {x:0,y:0}; this.rotation = 0; this.selected = null; this.day = false; this.hitAreas = [];
      this.city = {buildings:[],districts:[]}; this.width = 1; this.height = 1;
      new ResizeObserver(() => this.resize()).observe(canvas);
      canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoom(e.deltaY > 0 ? .9 : 1.1,{x:e.offsetX,y:e.offsetY}); },{passive:false});
      canvas.addEventListener('pointerdown', e => { if(e.button !== 0)return; this.drag = {x:e.clientX,y:e.clientY,panX:this.pan.x,panY:this.pan.y,moved:false}; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', e => {
        if(this.drag) { const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y; if(Math.hypot(dx,dy)>4)this.drag.moved=true; if(this.drag.moved){this.pan={x:this.drag.panX+dx,y:this.drag.panY+dy};this.draw();} this.onHover(null,e); }
        else { const file=this.pick(e.offsetX,e.offsetY); this.onHover(file,e); canvas.style.cursor=file?'pointer':'grab'; }
      });
      canvas.addEventListener('pointerup', e => { if(this.drag && !this.drag.moved) this.onSelect(this.pick(e.offsetX,e.offsetY)); this.drag=null; });
      canvas.addEventListener('pointercancel',()=>{this.drag=null;});
      canvas.addEventListener('lostpointercapture',()=>{this.drag=null;});
      canvas.addEventListener('pointerleave',()=>this.onHover(null));
      canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(!this.city.buildings.length)return;const id=this.selected?.id??-1;const step=e.key==='ArrowRight'?1:-1;this.onSelect(this.city.buildings[(id+step+this.city.buildings.length)%this.city.buildings.length]);}else if(['+','=','-','0'].includes(e.key)){e.preventDefault();e.key==='0'?this.fit():this.zoom(e.key==='-'?.85:1.15);}});
    }
    resize() { const rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;const ratio=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=Math.round(rect.height*ratio);this.ratio=ratio;this.fit(); }
    setCity(city) {this.city=city;this.selected=null;this.rotation=0;this.fit();}
    orient(x,y){if(this.rotation===1)return {x:-y,y:x};if(this.rotation===2)return{x:-x,y:-y};if(this.rotation===3)return{x:y,y:-x};return{x,y};}
    project(x,y,z=0) {const p=this.orient(x,y);return{x:(p.x-p.y)*30,y:(p.x+p.y)*15-z};}
    screen(p){return{x:p.x*this.scale+this.pan.x,y:p.y*this.scale+this.pan.y};}
    fit(){const points=[];for(const d of this.city.districts){for(const [x,y]of[[d.x,d.y],[d.x+d.width,d.y],[d.x+d.width,d.y+d.depth],[d.x,d.y+d.depth]])points.push(this.project(x,y));}for(const b of this.city.buildings)points.push(this.project(b.x,b.y,b.height));if(!points.length){this.draw();return;}const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y))-40,maxY=Math.max(...points.map(p=>p.y))+45;this.scale=Math.max(.08,Math.min(1.65,(this.width-90)/(maxX-minX),(this.height-150)/(maxY-minY)));this.pan={x:this.width/2-(maxX+minX)*this.scale/2,y:this.height/2-(maxY+minY)*this.scale/2};this.draw();}
    zoom(factor,anchor={x:this.width/2,y:this.height/2}){const old=this.scale;this.scale=Math.max(.08,Math.min(4,this.scale*factor));this.pan={x:anchor.x-(anchor.x-this.pan.x)*this.scale/old,y:anchor.y-(anchor.y-this.pan.y)*this.scale/old};this.draw();}
    rotate(){this.rotation=(this.rotation+1)%4;this.fit();}
    select(file){this.selected=file;this.draw();}
    polygon(points,fill,stroke){const ctx=this.ctx;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}
    tint(hex,factor){return '#'+hex.slice(1).match(/../g).map(n=>Math.min(255,Math.round(parseInt(n,16)*factor)).toString(16).padStart(2,'0')).join('');}
    quad(x,y,w,d,z=0){return [[x,y],[x+w,y],[x+w,y+d],[x,y+d]].map(([a,b])=>this.screen(this.project(a,b,z)));}
    draw(){if(!this.ctx)return;const ctx=this.ctx;ctx.setTransform(this.ratio||1,0,0,this.ratio||1,0,0);ctx.fillStyle=this.day?'#e7e9df':'#10131e';ctx.fillRect(0,0,this.width,this.height);this.hitAreas=[];
      // A quiet drafting grid stays fixed while the city can be panned.
      ctx.fillStyle=this.day?'#a0ada14a':'#67759524';for(let x=12;x<this.width;x+=26)for(let y=12;y<this.height;y+=26){ctx.beginPath();ctx.arc(x,y,.65,0,Math.PI*2);ctx.fill();}
      for(const d of this.city.districts){const ground=this.quad(d.x,d.y,d.width,d.depth);this.polygon(ground,this.day?'#ced5c4':'#202b37',this.day?'#adbda2':'#3e5461');
        const road=this.quad(d.x+.45,d.y+.45,d.width-.9,d.depth-.9);this.polygon(road,this.day?'#dce0d4':'#15202b',this.day?'#b4c1ab':'#324653');
        ctx.save();ctx.font=`${Math.max(9,11*this.scale)}px ui-monospace,monospace`;ctx.fillStyle=this.day?'#4d6451':'#82a396';ctx.textAlign='center';const label=this.screen(this.project(d.x+d.width/2,d.y+d.depth+.35));ctx.fillText(d.name.toUpperCase(),label.x,label.y+8);ctx.restore();
      }
      const ordered=[...this.city.buildings].sort((a,b)=>{const p=this.orient(a.x,a.y),q=this.orient(b.x,b.y);return p.x+p.y-q.x-q.y||p.x-q.x;});
      for(const b of ordered){const offset=(1-b.footprint)/2;const base=this.quad(b.x+offset,b.y+offset,b.footprint,b.footprint);const roof=this.quad(b.x+offset,b.y+offset,b.footprint,b.footprint,b.height);const color=C.TYPES[b.type].color;
        const center=base.reduce((p,q)=>({x:p.x+q.x/4,y:p.y+q.y/4}),{x:0,y:0});const front=base.map((p,i)=>({i,y:p.y})).sort((a,b)=>b.y-a.y)[0].i;const prev=(front+3)%4,next=(front+1)%4;
        const left=[base[prev],base[front],roof[front],roof[prev]],right=[base[front],base[next],roof[next],roof[front]];
        // Soft street-level shadows anchor each building.
        this.polygon(base.map(p=>({x:p.x+7*this.scale,y:p.y+3*this.scale})),this.day?'#88967e4d':'#070b1166');
        this.polygon(left,this.tint(color,this.day?.72:.45),this.tint(color,.65));this.polygon(right,this.tint(color,this.day?.87:.62),this.tint(color,.8));this.polygon(roof,this.tint(color,this.day?1:1.03),this.tint(color,1.1));
        if(this.scale>.28){const count=Math.min(12,Math.floor(b.height/13));for(let n=1;n<count;n++){const t=n/count;for(const [face,alpha]of[[left,.85],[right,.55]]){const a={x:face[0].x+(face[3].x-face[0].x)*t,y:face[0].y+(face[3].y-face[0].y)*t},z={x:face[1].x+(face[2].x-face[1].x)*t,y:face[1].y+(face[2].y-face[1].y)*t};ctx.strokeStyle=this.day?'#f9ffeaba':`rgba(228,249,239,${alpha})`;ctx.lineWidth=Math.max(.6,1.2*this.scale);ctx.setLineDash([2*this.scale,4*this.scale]);ctx.beginPath();ctx.moveTo(a.x+(z.x-a.x)*.16,a.y+(z.y-a.y)*.16);ctx.lineTo(a.x+(z.x-a.x)*.85,a.y+(z.y-a.y)*.85);ctx.stroke();ctx.setLineDash([]);}}}
        if(this.selected?.id===b.id){ctx.save();ctx.shadowBlur=12;ctx.shadowColor='#b3ff80';this.polygon(roof,null,'#caff95');ctx.restore();const p=this.screen(this.project(b.x+.5,b.y+.5,b.height+12));ctx.fillStyle=this.day?'#355d20':'#caff95';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();}
        this.hitAreas.push({file:b,polygons:[roof,left,right],center});
      }
    }
    pick(x,y){for(let i=this.hitAreas.length-1;i>=0;i--){const h=this.hitAreas[i];if(h.polygons.some(p=>C.pointInPolygon({x,y},p)))return h.file;}return null;}
    exportPng(name){const exportCanvas=document.createElement('canvas');exportCanvas.width=this.canvas.width;exportCanvas.height=this.canvas.height;const ctx=exportCanvas.getContext('2d');ctx.drawImage(this.canvas,0,0);const ratio=this.ratio||1;ctx.scale(ratio,ratio);ctx.fillStyle=this.day?'#1f382a':'#edf5f7';ctx.font='600 22px system-ui,sans-serif';ctx.fillText(`RepoCity / ${name}`,28,40);ctx.font='12px system-ui,sans-serif';ctx.fillStyle=this.day?'#58725f':'#94a5b8';ctx.fillText(`${this.city.buildings.length} files · ${this.city.districts.length} districts`,28,62);return new Promise((resolve,reject)=>exportCanvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create the image.')),'image/png'));}
  }
  window.CityRenderer=CityRenderer;
})();
