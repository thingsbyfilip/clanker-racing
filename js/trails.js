'use strict';
// Light trails (levels with `theme.trails`, e.g. the data center): every car leaves a glowing wall behind it in the colour of the car itself (RACER_COLORS: you first, then the five opponents).
// Purely visual (the walls are not solid). Only the newest TRAIL_MAX points of each car are kept, so the wall fades away behind it.
const TRAIL_MAX=190;
const trails=[], trailBufs={pb:gl.createBuffer(),nb:gl.createBuffer(),cb:gl.createBuffer(),count:0};
// called once per simulation step: append a point behind each car that has moved far enough (a jump or a respawn starts a new piece)
function trailsUpdate(){
  [car,...AIS].forEach((c,k)=>{
    const T=trails[k]||(trails[k]=[]), L=T.length?T[T.length-1]:null;
    if(c.wreckT>0){ if(L&&!L.b) T.push({x:c.x,y:c.y,z:c.z,b:true}); return; }
    const px=c.x-Math.sin(c.yaw)*1.9, pz=c.z-Math.cos(c.yaw)*1.9;
    let brk=true;
    if(L){ const d=Math.hypot(px-L.x,pz-L.z); if(d<1.4) return; brk=d>12||Math.abs(c.y-L.y)>14; }
    T.push({x:px,y:c.y,z:pz,b:brk});
    if(T.length>TRAIL_MAX+30) T.splice(0,30);
  });
}
// rebuild the wall mesh: a vertical ribbon along each trail, bright at the foot and fading towards the top and towards the tail
function updateTrailMesh(){
  const pos=[], col=[]; const H=2.5;
  trails.forEach((T,k)=>{
    const C=RACER_COLORS[k%RACER_COLORS.length], n=Math.min(T.length,TRAIL_MAX), o=T.length-n;
    for(let i=1;i<n;i++){
      const a=T[o+i-1], b=T[o+i]; if(b.b) continue;
      const fa=Math.pow((i-1)/n,1.3), fb=Math.pow(i/n,1.3), ga=.12+.88*fa, gb=.12+.88*fb;
      const A0=[a.x,a.y-.3,a.z], A1=[a.x,a.y+H,a.z], B0=[b.x,b.y-.3,b.z], B1=[b.x,b.y+H,b.z];
      const cA=C.map(v=>v*ga), cB=C.map(v=>v*gb), tA=C.map(v=>v*ga*.18), tB=C.map(v=>v*gb*.18);
      for(const [p,c] of [[A0,cA],[B0,cB],[B1,tB],[A0,cA],[B1,tB],[A1,tA]]){ pos.push(p[0],p[1],p[2]); col.push(c[0],c[1],c[2]); } } });
  const nor=new Float32Array(pos.length);                    // zero normals: emissive
  gl.bindBuffer(gl.ARRAY_BUFFER,trailBufs.pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,trailBufs.nb); gl.bufferData(gl.ARRAY_BUFFER,nor,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,trailBufs.cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);
  trailBufs.count=pos.length/3;
}
