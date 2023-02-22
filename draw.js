let logEl=document.getElementById('log')
/** @type {HTMLCanvasElement} */
let c=document.getElementById('img')
let ctx=c.getContext('2d');

function error(where,e) {
    logEl.innerHTML+=`<span style="color:red">Error at ${where}: ${e}</span>\n`
}
function log(where,e) {
    logEl.innerHTML+=`<span style="color:blue">Log at ${where}: ${e}</span>\n`
}
function clear() {
    logEl.innerHTML=""
}

let width=600;
let height=300;

c.width=width;
c.height=height;

async function _draw() {
    clear()
    let startTime=Date.now()

    try {
        eval(editor.getValue());
    } catch(e) {
        error("definition",e)
    }

    draw();

    log("end",`Took ${Date.now()-startTime} miliseconds`)
    
    document.getElementById("icon").href=c.toDataURL();
}