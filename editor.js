let defaultCode=`function draw() {
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle="red";
    ctx.beginPath();
    ctx.rect(10+Math.sin(Date.now()/1000)*20,10,30,20);
    ctx.fill();
    ctx.stroke();
}`

let autodrawEl=document.getElementById('autodraw');
let timeEl=document.getElementById('time');
let autodrawInterval;

function updateAutodraw() {
    clearInterval(autodrawInterval);
    if (autodrawEl.checked) autodrawInterval=setInterval(()=>{
        _draw()
    },timeEl.value*1000)
}
let autosaveTimeout=0;

require.config({ paths: { vs: 'monaco/min/vs' } });
require(['vs/editor/editor.main'], async function () {
    // compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES5,
        // lib:[],
        allowNonTsExtensions: true
    });
    // Change auto-complete
    let libSource = await (await fetch('canvas-lib.d.ts')).text()
    let libUri = 'ts:canvas-lib.d.ts';
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    // When resolving definitions and references, the editor will try to use created models.
    // Creating a model for the library allows "peek definition/references" commands to work with the library.
    monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
    
    window.editor = monaco.editor.create(document.getElementById('code'), {
        value: "loading",
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true
    });

    document.getElementById("code").addEventListener("keydown",(ev)=>{
        clearTimeout(autosaveTimeout);
        autosaveTimeout=setTimeout(()=>{
            console.log("saving...");
            save();
        },1000);
    },true)

    let f=()=>{
        if (emmetOn) {
            load();
        } else {
            setTimeout(f,100)
        }
    };
    f()
    
    timeEl.addEventListener('change',()=>{
        updateAutodraw()
    })
    autodrawEl.addEventListener('change',()=>{
        updateAutodraw()
    })
});

// function save(fileName) {
//     localStorage.setItem(`file-${fileName}`,editor.getValue());
// }

// function load(fileName) {
//     let files=[];
//     for (let i=0;i<localStorage.length;i++) {
//         if (localStorage.key(i).startsWith("file-"))
//             files.push(localStorage.key(i));
//     }
//     fileName=`file-${fileName}`;
//     if (files.indexOf(fileName)!==-1) {
//         editor.setValue(localStorage.getItem(fileName));
//     }
// }

/**
 * @typedef {{
 *  name: string,
 *  code: string,
 * }} Tab
 */
/**
 * @type {Tab[]}
 */
let tabs=[];
let currentTab=0;

function addTab(name,code) {
    tabs.push({
        name,code
    })
}

function renderTabs() {
    let tabsEl=document.getElementById("tabs");
    while (tabsEl.childElementCount!==0) {
        tabsEl.removeChild(tabsEl.children[0])
    }
    tabsEl.innerHTML=""

    let i=0
    for (let tab of tabs) {
        if (tab.name==null) continue;
        let el=Emmet(`div.tab${currentTab===i?".active":""}(onclick="tabClick('${tab.name}')") > p{${tab.name}} + div.edit(title="Rename Tab",onclick="renameTab('${tab.name}')")>box-icon(name="edit",color="#1b61f8",size="18px") ^ div.close(title="Delete Tab", onclick="tabClose('${tab.name}')")>box-icon(name="x",color="#dd0000",size="18px")`)
        tabsEl.appendChild(el);
        i++;
    }
}

function newTab() {
    let name=prompt(`Tab name:`);
    if (!name) {
        alert("cancelled.");
        return;
    }

    addTab(name,defaultCode);
    renderTabs();
    tabClick(name);
    save();
}

function tabClose(name) {
    let c=confirm(`Are you sure you want to delete ${name}?`)
    if (!c) return;

    let i=0;
    for (let t of tabs) {
        if (t.name===name) {
            tabs.splice(i,1)
            break;
        }
        i++
    }

    if (tabs.length===0) {
        addTab("Tab",defaultCode)
    }

    renderTabs()
    tabClick(tabs[Math.min(currentTab,tabs.length-1)].name)
    save();
}

function renameTab(name) {
    let newName=prompt("New name:");
    if (!newName) {
        alert("Cancelled");
        return;
    }
    let i=0;
    for (let t of tabs) {
        if (t.name==name) {
            tabs[i].name=newName
        }
        i++;
    }

    renderTabs();
    save();
}

function tabClick(name) {
    c.width=width;
    let i=0;
    for (let t of tabs) {
        if (t.name==name) {
            editor.setValue(t.code);
            currentTab=i;
            break;
        }
        i++;
    }

    renderTabs()
}

function save() {
    if (tabs[currentTab])
        tabs[currentTab].code=editor.getValue();
    localStorage.setItem("canvas-playground-tabs",JSON.stringify(tabs))
}

let emmetOn=false;

function emmetLoad() {
    emmetOn=true;
}

function load() {
    tabs=JSON.parse(localStorage.getItem("canvas-playground-tabs"))||[];

    tabClick(tabs[0].name);
    renderTabs();
}