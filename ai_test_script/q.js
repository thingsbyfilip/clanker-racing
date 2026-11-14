// node q.js <level> <snippet file>: runs the snippet in the game's scope (after lgprobe.js) and prints its value
const {boot,run}=require('./h.js'),fs=require('fs'); const c=boot('?level='+process.argv[2]); run(c,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
console.log(run(c,fs.readFileSync(process.argv[3],'utf8')));
