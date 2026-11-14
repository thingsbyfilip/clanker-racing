// node trace.js <level> <diff> <s0> <s1> [car] [tweak json] [lap]
const {boot,run}=require('./h.js'), fs=require('fs'); const a=process.argv;
const ctx=boot('?level='+a[2]+'&diff='+a[3]); run(ctx,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
console.log(run(ctx,`lgTrace('${a[2]}','${a[3]}',${a[4]},${a[5]},${a[6]||2},${a[7]||'{}'},${a[8]||0})`));
