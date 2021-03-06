//
// 自动化截取刷卡资料
//

'use strict';	// Whole-script strict mode applied.

const http = require('http');   // NOTE: import default module
const fs = require('fs');       // NOTE: import default module
const querystring = require('querystring'); // NOTE: import default module

//
// Step 1: Open login page to get cookie 'ASP.NET_SessionId' and hidden input '_ASPNetRecycleSession'.
//
const ce = {    // single global variable
    _ASPNET_SessionId:"",   // cookie
    OGWeb:"",               // cookie
    _ASPNetRecycleSession:"",   // hidden input
    __VIEWSTATE: "",            // hidden input
    __EVENTVALIDATION: ""       // hidden input
};
//var _ASPNET_SessionId;
//var _ASPNetRecycleSession;
var bytesGot = 0;

function openLoginPage() {
    return new Promise( (resolve, reject) => {
        let req = http.request("http://twhratsql.whq.wistron/OGWeb/LoginForm.aspx", response => {
            let chunks = [];
            response.addListener('data', (chunk) => {
                bytesGot += chunk.byteLength;
                chunks.push(chunk);
            });
            response.on('end', () => {
                let buff = Buffer.concat(chunks);
                let html = buff.toString();
                if (response.statusCode===200) {
                    let fo = fs.createWriteStream('tmp/step1-LoginPage.html');
                    fo.write(html);
                    fo.end();
                    let cookie = response.headers['set-cookie'][0];
                    let patc = new RegExp('ASP.NET_SessionId=(.*?);');
                    let mc = patc.exec(cookie);
                    if (mc) {
                        //_ASPNET_SessionId = mc[1];
                        ce._ASPNET_SessionId = mc[1];
                    }
                    let patm =  new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                    let mm = patm.exec(html);
                    if (mm) {
                        //_ASPNetRecycleSession = mm[1];
                        ce._ASPNetRecycleSession = mm[1];
                    }
                    resolve({_ASPNET_SessionId:ce._ASPNET_SessionId, _ASPNetRecycleSession:ce._ASPNetRecycleSession});
                } else {
                    reject(`Step1 HTTP error: ${response.statusMessage}`);
                }
            });
        });
        req.on('error', e => {
            reject(`Step1 Problem: ${e.message}`);
        });
        req.end();
    });
}

//
// Step 2: POST data to login to get cookie 'OGWeb'.
//
//var OGWeb;

function login() {
    return new Promise( (resolve, reject) => {
        let postData = querystring.stringify({
            '__ctl07_Scroll': '0,0',
            '__VIEWSTATE': '/wEPDwULLTEyMTM0NTM5MDcPFCsAAmQUKwABZBYCAgMPFgIeBXN0eWxlBTFiZWhhdmlvcjp1cmwoL09HV2ViL3RxdWFya19jbGllbnQvZm9ybS9mb3JtLmh0Yyk7FhACCA8UKwAEZGRnaGQCCg8PFgIeDEVycm9yTWVzc2FnZQUZQWNjb3VudCBjYW4gbm90IGJlIGVtcHR5LmRkAgwPDxYCHwEFGlBhc3N3b3JkIGNhbiBub3QgYmUgZW1wdHkuZGQCDQ8PFgIeB1Zpc2libGVoZGQCDg8UKwAEZGRnaGQCEg8UKwADDxYCHgRUZXh0BSlXZWxjb21lIFRvIOe3r+WJteizh+mAmuiCoeS7veaciemZkOWFrOWPuGRkZ2QCFA8UKwADDxYCHwMFK0Jlc3QgUmVzb2x1dGlvbjoxMDI0IHggNzY4OyBJRSA2LjAgb3IgYWJvdmVkZGdkAhsPFCsAAmQoKWdTeXN0ZW0uRHJhd2luZy5Qb2ludCwgU3lzdGVtLkRyYXdpbmcsIFZlcnNpb249Mi4wLjAuMCwgQ3VsdHVyZT1uZXV0cmFsLCBQdWJsaWNLZXlUb2tlbj1iMDNmNWY3ZjExZDUwYTNhBDAsIDBkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYCBQVjdGwwNwUITG9naW5CdG6vo0TFNrmm9RKH7uSQ+NY2OXccyA==',
            '__VIEWSTATEGENERATOR': 'F163E3A2',
            '_PageInstance': '1',
            '__EVENTVALIDATION': '/wEWBAK20LBAAsiTss0OArOuiN0CArmtoJkDPmmwqug37xjPhGglEwK8JU9zleg=',
            'UserPassword': 'S0808001',
            'UserAccount': 'S0808001',
            'LoginBtn.x': '74',
            'LoginBtn.y': '10',
            '_ASPNetRecycleSession': ce._ASPNetRecycleSession
        });
        let req = http.request({
            hostname: "twhratsql.whq.wistron",
            path: "/OGWeb/LoginForm.aspx",
            method: "POST",
            headers: {
                'Cookie': 'ASP.NET_SessionId='+ce._ASPNET_SessionId,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, response => {
            let chunks = [];
            response.on('data', chunk => {
                bytesGot += chunk.byteLength;
                chunks.push(chunk);
            });
            response.on('end', () => {
                let buff = Buffer.concat(chunks);
                let html = buff.toString();
                if (response.statusCode===302) {
                    let fo = fs.createWriteStream('tmp/step2-login.html');
                    fo.write(html);
                    fo.end();
                    let cookie = response.headers['set-cookie'][0];
                    let patc = new RegExp('OGWeb=(.*?);');
                    let mc = patc.exec(cookie);
                    if (mc) {
                        //OGWeb = mc[1];
                        ce.OGWeb = mc[1];
                    }
                    resolve(ce);
                } else {
                    reject(`Step2 HTTP error: ${response.statusMessage}`);
                }
            });
        });
        req.on('error', e => {
            reject(`Step2 Problem: ${e.message}`);
        });
        req.write(postData);
        req.end();
    });
}

//
// Step 3: Open EntryLogQueryForm.aspx page to get hidden input '_ASPNetRecycleSession', '__VIEWSTATE' and '__EVENTVALIDATION'.
//
//var __VIEWSTATE = '';
//var __EVENTVALIDATION = '';

function step3() {
    return new Promise( (resolve, reject) => {
        let req = http.request({
            hostname: "twhratsql.whq.wistron",
            path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
            //method: "GET",    // Default can be omitted.
            headers: {
                'Cookie': `ASP.NET_SessionId=${ce._ASPNET_SessionId}; OGWeb=${ce.OGWeb}`
            }
        }, response => {
            let chunks = [];
            response.on('data', (chunk) => {
                bytesGot += chunk.byteLength;
                chunks.push(chunk);
            });
            response.on('end', () => {
                let buff = Buffer.concat(chunks);
                let html = buff.toString();
                if (response.statusCode===200) {
                    let fo = fs.createWriteStream('tmp/step3.html');
                    fo.write(html);
                    fo.end();
                    let patm =  new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                    let mm = patm.exec(html);
                    if (mm) {
                        //_ASPNetRecycleSession = mm[1];
                        ce._ASPNetRecycleSession = mm[1];
                    }
                    let patv =  new RegExp('<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="(.*?)"');
                    let mv = patv.exec(html);
                    if (mv) {
                        //__VIEWSTATE = mv[1];
                        ce.__VIEWSTATE = mv[1];
                    }
                    let pate =  new RegExp('<input type="hidden" name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="(.*?)"');
                    let me = pate.exec(html);
                    if (me) {
                        //__EVENTVALIDATION = me[1];
                        ce.__EVENTVALIDATION = me[1];
                    }
                    resolve(ce);
                } else {
                    reject(`Step3 HTTP error: ${response.statusMessage}`);
                }
            });
        });
        req.on('error', e => {
            reject(`Step3 Problem: ${e.message}`);
        });
        req.end();
    });
}

async function initialize() {
    await openLoginPage().then( result => {
        console.log(`Step1 login page received and we got Cookie ASP.NET_SessionId: ${result._ASPNET_SessionId} and Element _ASPNetRecycleSession: ${result._ASPNetRecycleSession}`);
        return login();
    }).then( result => {
        console.log(`Step2 done and we got Cookie OGWeb: \x1b[32momitted\x1b[0m.`);
        return step3();
    }).then( result => {
        console.log(`Step3 done and we got Element _ASPNetRecycleSession: ${result._ASPNetRecycleSession} Element __VIEWSTATE: \x1b[32momitted\x1b[0m Element __EVENTVALIDATION: \x1b[32momitted\x1b[0m`);
        console.log(`${bytesGot} bytes received during step1~3.`);
    }).catch(e=>{throw e});
}

//
// Step 4: POST data to inquire.
//
/**
 * 截取某人的刷卡资料。
 * @param {string} beginDate 开始日期 e.g. 2021-1-11
 * @param {string} endDate 截止日期 e.g. 2021-1-16
 * @param {string} employeeIdOrName 工号或名字
 * @param {boolean} nextPage if go to next page
 */
function inquire0(beginDate, endDate, employeeIdOrName, nextPage) {
    return new Promise( (resolve, reject) => {
        const beginTime = '0:00';
        const endTime = '23:59';
        let postObj = {
            'TQuarkScriptManager1': 'QueryResultUpdatePanel|QueryBtn',
            'TQuarkScriptManager1_HiddenField': ';;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:411fea1c:865923e8;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:91bd373d:d7d5263e:f8df1b50;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e7c87f07:bbfda34c:30a78ec5;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:9b7907bc:9349f837:d4245214;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e3d6b3ac;',
            '__ctl07_Scroll': '0,0',
            '__VIEWSTATEGENERATOR': 'A21EDEFC',
            '_ASPNetRecycleSession': ce._ASPNetRecycleSession,
            '__VIEWSTATE': ce.__VIEWSTATE,
            '_PageInstance': 26,
            '__EVENTVALIDATION': ce.__EVENTVALIDATION,
            'AttNoNameCtrl1$InputTB': '上海欽江路',
            'BeginDateTB$Editor': beginDate,
            'BeginDateTB$_TimeEdit': beginTime,
            'EndDateTB$Editor': endDate,
            'EndDateTB$_TimeEdit': endTime,
            'EmpNoNameCtrl1$InputTB': employeeIdOrName
        };
        if ( nextPage ) {
            postObj['GridPageNavigator1$NextBtn'] = 'Next Page';
        } else {
            postObj['QueryBtn'] = 'Inquire';
        }
        let postData = querystring.stringify(postObj);

        let req = http.request({
            hostname: "twhratsql.whq.wistron",
            path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
            method: "POST",
            headers: {
                'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; MAARJS)',	// mimic IE 11
                'X-MicrosoftAjax': 'Delta=true',
                'Cookie': `ASP.NET_SessionId=${ce._ASPNET_SessionId}; OGWeb=${ce.OGWeb}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (response) => {
            let chunks = [];
            response.on('data', (chunk) => {
                bytesGot += chunk.byteLength;
                chunks.push(chunk);
            });
            response.on('end', () => {
                let buff = Buffer.concat(chunks);
                let html = buff.toString();
                if ( response.statusCode === 200 ) {
                    let result = parseKQ(html);
                    /*
                    let fo = fs.createWriteStream(`tmp/step4-inquire-${employeeIdOrName}-${result.curPage}.html`);
                    fo.write(html);
                    fo.end();
                    */
                    resolve(result);
                } else {
                    let msg = `Inquiry HTTP error: ${response.statusMessage}`;
                    reject(msg);
                }
            });
        });

        req.on('error', e => {
            let msg = `Step4 Problem: ${e.message}`;
            reject(msg);
        });

        req.end(postData);
    });
}

/**
 * 
 * @param {*} n 
 * @param {*} width 
 * @param {*} z 
 * @return {string}
 */
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * Parse the input html to get 刷卡 data.
 * @param {*} html
 * @return number of current page and number of total pages.
 */
function parseKQ(html) {
    // Get number of pages.
    let curPage = 1, numPages = 1;
    let rexTotal = new RegExp('<span id="GridPageNavigator1_CurrentPageLB">(.*?)</span>[^]*?<span id="GridPageNavigator1_TotalPageLB">(.*?)</span>');
    let match = rexTotal.exec(html);
    if ( match ) {
        curPage = parseInt(match[1]);
        numPages = parseInt(match[2]);
    }
    // Update __VIEWSTATE __EVENTVALIDATION
    let rexVS = new RegExp("__VIEWSTATE[\|](.*?)[\|]");
    let matVS = rexVS.exec(html);
    if ( matVS ) {
        ce.__VIEWSTATE = matVS[1];
    }
    let rexEV = new RegExp("__EVENTVALIDATION[\|](.*?)[\|]");
    let matEV = rexEV.exec(html);
    if ( matEV ) {
        ce.__EVENTVALIDATION = matEV[1];
    }
    let items = [];
    while (true) {
        let rex =  new RegExp('<td>(.*?)</td><td>&nbsp;</td><td><.*?>(.*?)</a></td><td>(.*?)</td><td>.*?</td><td>(.*?)</td>', 'g');   // Flag 'g' is required
        let m = rex.exec(html);
        if (m) {
            let dt = m[4].split(" ");
            let da = dt[0].split('/');
            // Department EID Name Day Time
            // e.g. '8SSX00' 'S1901099' '张三 (John Doe)' '2021/01/11' '07:58:08'
            items.push( [ m[1], m[2], m[3], da[2]+'/'+pad(da[0],2)+'/'+pad(da[1],2), dt[1] ] );
            html = html.substr(rex.lastIndex);
        } else {
			break;
		}
    }
    return {curPage: curPage, numPages: numPages, items: items};
}

/**
 * 截取某人的刷卡资料。
 * @param {string} beginDate 开始日期 e.g. 2021-1-11
 * @param {string} endDate 截止日期 e.g. 2021-1-16
 * @param {string} employeeIdOrName 工号或名字
 */
async function inquire(beginDate, endDate, employeeIdOrName) {
    let nextPage = false;
    let done = false;
    let allItems = [];
    while (!done) {
        await inquire0(beginDate, endDate, employeeIdOrName, nextPage).then((result)=>{
            allItems = allItems.concat( result.items );
            // \x1b[1A : moves cursor up 1 line
            // \x1b[32m : foreground green
            // \x1b[0m : reset
            console.log(`\x1b[1A\x1b[32m${result.curPage}/${result.numPages}\x1b[0m`);
            if ( result.curPage < result.numPages ) {
                nextPage = true;
            } else {
                //console.log(`Inquiry about ${employeeIdOrName} is done.`);
                done = true;
            }
        }, e=>{throw e});
    }
    return allItems;
}

function judge(theDay, signIn, signOut) {
    let status = "";
    let t1 = new Date(theDay+" "+signIn);
    let tl1 = new Date(t1);
    tl1.setHours(8);    // 上班打卡时限 8:50
    tl1.setMinutes(50);
    tl1.setSeconds(59);
    if ( t1 > tl1 ) {
        status = "遲到";
    }
    if ( !signOut ) {
        if (status) { status += "/"; }
        status += "只刷一次";
        return status;
    }
    let t2 = new Date(theDay+" "+signOut);
    let tl2 = new Date(t2);
    tl2.setHours(16);   // 下班打卡时限 16:50
    tl2.setMinutes(50);
    tl2.setSeconds(0);
    if ( t2 < tl2 ) {
        if (status) { status += "/"; }
        status += "早退";
    }
    if ( (t2-t1) < (9*60*60-59)*1000 ) {
        if (status) { status += "/"; }
        status += "工时不足";
    }
    if ( !status ) {
        status = "正常";
    }
    return status;
}

function findOnePersonRecords(itms, idx1) {
    let x1, x2;
    if ( idx1 >= itms.length ) {
        return null;
    }
    x1 = idx1;
    let eid = itms[x1][1];
    for (x2 = x1+1; x2 < itms.length; x2++) {
        if ( itms[x2][1] !== eid ) {
            break;
        }
    }
    return {x1: x1, x2: x2};
}

/**
 * 
 * @param {string} eid employee ID
 */
function identifyPerson(eid) {
    for (let i = 0; i < wsh.length; i++) {
        if ( wsh[i][1] === eid ) {
            return i;
        }
    }
    return null;
}

function findCalendar(dayStr) {
    for (let i = 0; i < baseline.length; i++) {
        if ( baseline[i].ds === dayStr ) {
            return i;
        }
    }
    return null;
}

function findOneDayRecords(x1, x2, itms) {
    let ds = itms[x1][3];
    let i = x1 + 1;
    for (; i < x2; i++) {
        if ( itms[i][3] !== ds ) {
            break;
        }
    }
    return i;
}

function judge1Day(theDay, signIn, signOut, tl1, tl2) {
    let status = "";
    let cls = "";
    let t1 = new Date(theDay+" "+signIn);
    if ( t1 > tl1 ) {
        status = "遲到";
        cls = "late-arrival";
    }
    if ( !signOut ) {
        if (status) { status += "/"; }
        status += "只刷一次";
        if (cls) { cls += " "; }
        cls += "only-once";
        return {status:status, cls:cls};
    }
    let t2 = new Date(theDay+" "+signOut);
    if ( t2 < tl2 ) {
        if (status) { status += "/"; }
        status += "早退";
        if (cls) { cls += " "; }
        cls += "early-leave";
    }
    if ( (t2-t1) < (9*60*60-59)*1000 ) {
        if (status) { status += "/"; }
        status += "工时不足";
        if (cls) { cls += " "; }
        cls += "insufficient";
    }
    if ( !status ) {
        status = "正常";
    }
    return {status:status, cls:cls};
}

/**
 * Traverse on person's records.
 * @param {*} pr 
 * @param {*} itms 
 */
function traverseOne(pr, itms) {
    let px = identifyPerson(itms[pr.x1][1]);
    if ( px == null ) {
        console.log(`Who is this guy ${itms[pr.x1][1]} ${itms[pr.x1][2]} ?`)
        return;
    }
    for (let i = pr.x1; i < pr.x2;) {
        let dx = findCalendar(itms[i][3]);
        if ( dx !== null ) {
            let signIn = itms[i][4];
            let signOut = "";
            let t2 = findOneDayRecords(i, pr.x2, itms);
            if ( t2 - i >= 2 ) {
                signOut = itms[t2-1][4];
            }
            let r = judge1Day(itms[i][3], signIn, signOut, baseline[dx].tl1, baseline[dx].tl2);
            let r2 = {dpt:itms[i][0], name:itms[i][2], status:r.status, cls:r.cls, signIn:signIn, signOut:signOut};
            records[px][dx] = r2;
            i = t2;
        } else {
            i = findOneDayRecords(i, pr.x2, itms);  // Skip this day's records. Not likely.
        }
    }
}

function traverse(itms) {
    let idx1 = 0;
    while (true) {
        let pr = findOnePersonRecords(itms, idx1);
        if ( !pr ) {
            break;
        }
        traverseOne(pr, itms);
        idx1 = pr.x2;
    }
}

/**
 * Check one person's status.
 * @param {String} theDay 当天
 * @param {String} dpt 部门
 * @param {String} eid 工号
 * @param {String} name 姓名
 * @param {Date} tl1 上班打卡时限，当天的 08:50:59
 * @param {Date} tl2 下班打卡时限，当天的 16:50:00
 * @param {Array} itms 某人当天的刷卡记录
 */
function checkOne(theDay, dpt, eid, name, tl1, tl2, itms) {
    let status = "";
    let cls = "";
    function judge() {
        let t1 = new Date(theDay+" "+signIn);
        if ( t1 > tl1 ) {
            status = "遲到";
            cls = "late-arrival";
        }
        if ( !signOut ) {
            if (status) { status += "/"; }
            status += "只刷一次";
            if (cls) { cls += " "; }
            cls += "only-once";
            return;
        }
        let t2 = new Date(theDay+" "+signOut);
        if ( t2 < tl2 ) {
            if (status) { status += "/"; }
            status += "早退";
            if (cls) { cls += " "; }
            cls += "early-leave";
        }
        if ( (t2-t1) < (9*60*60-59)*1000 ) {
            if (status) { status += "/"; }
            status += "工时不足";
            if (cls) { cls += " "; }
            cls += "insufficient";
        }
        if ( !status ) {
            status = "正常";
        }
    }
    let signIn = "", signOut = "";
    if ( itms.length === 0 ) {  // NOTE: valid only for request one by one
        status = "请假";
        cls = "absent";
    } else {
        name = itms[0][2];
        dpt = itms[0][0];
        if ( itms.length === 1 ) {
            signIn = itms[0][4];
            signOut = "";
        } else if ( itms.length >= 2 ) {
            signIn = itms[itms.length-1][4];
            signOut = itms[0][4];
        }
    }
    if ( !status ) {    // Empty string is false too.
        judge();
    }
    if ( status === "正常" ) {
        console.log(`${dpt} ${eid} ${name} ${theDay}: ${status}`);
        //report += "";
    } else {
        console.log(`${dpt} ${eid} ${name} ${theDay}: \x1b[41m%s\x1b[0m`, status); // BgRed for status then reset
        //let yy = `<td>${dpt}</td><td>${eid}</td><td>${name}</td><td class=${cssStatus} title="${signIn} ~ ${signOut}">${status}</td>`;
    }
    return {dpt:dpt, name:name, status:status, cls:cls, signIn:signIn, signOut:signOut};
}

var wsh = [
    ["8SS000", "TMP8106062", "黄世勇"],	// 上海軟體開發處
    ["8SS000", "S0109003", "徐应军"],
    ["8SS100", "S0107011", "林波"],   // 軟件一部
    ["8SS100", "S0203002", "郑晓雁"],
    ["8SS100", "S0607002", "汤晓莉"],
    ["8SS100", "S0609001", "裘佳"],
    ["8SS100", "S1005001", "夏斯宏"],
    ["8SS100", "S1007002", "杨晴"],
    ["8SS100", "S1105001", "戴运杰"],
    ["8SS100", "S0108001", "杨清鞠"],
    ["8SS100", "S1007004", "王雅娟"],
    ["8SS100", "S2101001", "张悦"],
    ["8SS500", "S9807008", "胡海良"], // 軟件五部
    ["8SS500", "S9907004", "周敏"],
    ["8SS500", "S0607001", "孙松"],
    ["8SS500", "S0712002", "张松涛"],
    ["8SS500", "S1001001", "花春荣"],
    ["8SS500", "S1607001", "刘晴晴"],
    ["8SS500", "S1702001", "张佳峰"],
    ["8SS500", "S1903001", "吴永辉"],
    ["8SS500", "S1905001", "李旭超"],
    ["8SS500", "S1907001", "王洪元"],
    ["8SS500", "S2007001", "程杰"],
    ["8SS600", "S0511001", "张翀"],   // 軟件六部
    ["8SS600", "S1109002", "庞美静"],
    ["8SS600", "S1606004", "潘远生"],
    ["8SS600", "S1703004", "袁琼"],
    ["8SS600", "S1907003", "卢奕粲"],
    ["8SS600", "S1907002", "杨文静"],
    ["8SS600", "S2003001", "庄银环"],
    ["8SS600", "S2005001", "陳夢宇"],
    ["8SS600", "S2006001", "李伟捷"],
    ["8SS600", "S2008001", "刘毅炫"],
    ["8SS600", "S2009001", "丁达诚"],
    ["8SS600", "S2011001", "余圣骏"],
    ["8SS600", "S2012001", "齐芮萌"],
    ["8SS700", "S0008020", "冼策"],   // 軟件七部
    ["8SS700", "S0905001", "张巧平"],
    ["8SS700", "S1706003", "李超"],
    ["8SS700", "S1707002", "刘诗倩"],
    ["8SS700", "S2004001", "姜超"],
    ["8SS700", "S2004002", "胡栩搴"],
    ["8SS700", "S2008003", "杨欢"],
    ["MT0H00", "TMP8410009", "刘皇辰"],	// 人力資源
    ["MT0H00", "S9710008", "陈芸淑"],
    ["MT0H00", "S0404001", "邬承辉"],
    ["MT0H00", "S1705001", "单佳佳"],
    ["MT0F00", "S0004007", "梁洁"],   // 財務
    ["MT0Q00", "S9912003", "闵靖"],   // 質量保證室
    ["NMMR00", "S2008002", "葛承军"]  // 專案管理室
];

var records;

async function askAll() {
    if ( baseline.length === 0 ) {
        console.error("Are you kidding me?");
        return;
    }
    await initialize();
    console.log("");
    records = [];
    for (let i=0; i < wsh.length; i++) {
        records.push([]);
        for (let j=0; j < baseline.length; j++) {
            let r = {dpt:wsh[i][0], name:wsh[i][2], status:"请假", cls:"absent", signIn:"", signOut:""};
            records[i].push(r);
        }
    }

    // Sort by EID, Day, Time in ascending order.
    let cmp = (a, b) => a[1]!==b[1] ? (a[1]<b[1]?-1:1) : (a[3]!==b[3] ? (a[3]<b[3]?-1:1) : (a[4]<b[4]?-1:1));
    await inquire(baseline[0].day.toLocaleDateString(), baseline[baseline.length-1].day.toLocaleDateString(), '').then(items=>{
        console.log(`inquire ${baseline[0].day.toLocaleDateString()} ~ ${baseline[baseline.length-1].day.toLocaleDateString()} all people`);    // DEBUG
        items.sort( cmp );
        traverse(items);
    }, e=>{throw e});
}

async function askOneByOne() {
    if ( baseline.length === 0 ) {
        console.error("Are you kidding me?");
        return;
    }
    await initialize();
    console.log("");
    records = [];
    for (let i=0; i < wsh.length; i++) {
        records.push([]);
    }
    for (let i=0; i < baseline.length; i++) {
        // day.toLocaleString() -> '1/18/2021, 12:00:00 AM'  // NOTE: what if locale changed?
        let theDay = baseline[i].day.toLocaleDateString();
        //console.log(`do ${theDay} ${baseline[i].tl1.toLocaleString()} ${baseline[i].tl2.toLocaleString()}`);
        let tl1 = baseline[i].tl1;
        let tl2 = baseline[i].tl2;
        //fo.write(report);
        //fo.end();
        for (let i=0; i < wsh.length; i++) {
            await inquire(theDay, theDay, wsh[i][1]).then(items=>{
                let r = checkOne(theDay, wsh[i][0], wsh[i][1], wsh[i][2], tl1, tl2, items);
                // {dpt:dpt, name:name, status:status, cls:cls, signIn:signIn, singOut:signOut}
                records[i].push(r);
            }, e=>{throw e});
        }
    }
}

const dayNames = [
    "周日",
    "周一",
    "周二",
    "周三",
    "周四",
    "周五",
    "周六"
];

var baseline = [];

function makeTitle(fo, day1, day2) {
    let reportTemplate =
`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>考勤 ${day1} ~ ${day2}</title>
<style>
    .absent {
        background-color: red;
    }
    .late-arrival, early-leave, .insufficient {
        background-color: yellow;
    }
    .only-once {
        background-color: magenta;
    }
    th.weekday {
        background-color: cyan;
    }
    th.weekend {
        background-color: rgba(255, 115, 0, 0.61);
    }
</style>
</head>
<body>
<table border="1">
\t<tr>
\t\t<th>部门</th><th>工号</th><th>姓名</th>`;
    fo.write(reportTemplate);
    Date.prototype.addDays=function(d){return new Date(this.valueOf()+864e5*d);};
    let dayX = new Date(day1);
    let dayEnd = new Date(day2);
    while (dayX <= dayEnd) {
        let year = dayX.getFullYear();
        let month = dayX.getMonth()+1;
        let day = dayX.getDate();
        let wd = dayX.getDay();
        let cnt = `${month}/${day}`;
        let title = `${year}/${cnt} ${dayNames[wd]}`;
        let cls = (1<=wd&&wd<=5) ? "weekday" : "weekend";
        // <th title="2021/1/13 周三" class="weekday">1/13</th>
        fo.write(`<th title="${title}" class="${cls}">${cnt}</th>`);
        let tl1 = new Date(dayX);
        let tl2 = new Date(dayX);
        tl1.setHours(8);    // 上班打卡时限 08:50:59
        tl1.setMinutes(50);
        tl1.setSeconds(59);
        tl2.setHours(16);   // 下班打卡时限 16:50:00
        tl2.setMinutes(50);
        tl2.setSeconds(0);
        baseline.push({day:dayX, tl1:tl1, tl2:tl2, ds: year+'/'+pad(month,2)+'/'+pad(day,2)});
        dayX = dayX.addDays(1);
    }
    fo.write("\n\t</tr>\n");
}

function report(fo) {
    for (let i=0; i < wsh.length; i++) {
        let dpt = wsh[i][0];    // initial department name
        let name = wsh[i][2];   // initial name
        fo.write("\t<tr>\n");
        for (let j=0; j < baseline.length; j++) {
            if ( records[i][j].dpt !== dpt ) {
                dpt = records[i][j].dpt;    // Override the default
                name = records[i][j].name;
                break;
            }
        }
        fo.write(`\t\t<td>${dpt}</td><td>${wsh[i][1]}</td><td>${name}</td>`);
        for (let j=0; j < baseline.length; j++) {
            let r = records[i][j];
//            fo.write(`<td title="${r.signIn} ~ ${r.signOut}" class="${r.cls}">${r.status}</td>`);
            fo.write(`<td title="${r.signIn===''&&r.signOut==='' ? '' : r.signIn+' ~ '+r.signOut}" class="${r.cls}">${r.status}</td>`);
        }
        fo.write("\n\t</tr>\n");
    }
}

(async function() {
    fs.mkdir("./tmp", ()=>{
        console.log("Rock and Roll");
        let t1 = new Date();
        let fo = fs.createWriteStream('tmp/result.html');
        let dayBegin = '2020-11-9';
        let dayEnd = '2021-1-21';
        makeTitle(fo, dayBegin, dayEnd);
        //askOneByOne().then( ()=>{
        askAll().then( ()=>{
            report(fo);
            fo.end("</table>\n</body>\n</html>");
            let t2 = new Date();
            console.log(`${bytesGot} bytes received.`);
            console.log(`Work from ${t1.toLocaleString()} to ${t2.toLocaleString()} used ${(t2-t1)/1000} seconds.`);
        }).catch(e=>{
            console.log("Exception caught.");
            console.error(e);
            console.log("Exception reported.");
        });
    })
})();
